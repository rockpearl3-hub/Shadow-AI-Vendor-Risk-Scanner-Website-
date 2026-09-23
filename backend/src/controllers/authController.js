const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateSecret, generateSync, verifySync, generateURI } = require('otplib');
const qrcode = require('qrcode');
const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('../services/encryptionService');
const { sendEmail } = require('../services/emailService');
const { logAuditEvent } = require('../services/auditLogger');

const prisma = new PrismaClient();

/**
 * Helper to generate random backup codes
 */
function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase()); // e.g. "A1B2C3D4"
  }
  return codes;
}

/**
 * POST /api/auth/signup
 */
async function signup(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'admin' : 'viewer';

    const user = await prisma.user.create({
      data: { email: cleanEmail, passwordHash, role, isActive: true },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'user_signed_up',
      entityType: 'User',
      entityId: user.id,
    });

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: user.id, email: user.email, role: user.role, isActive: user.isActive, mfaEnabled: false },
    });
  } catch (err) {
    console.error('[signup]', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated by an admin.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      // Issue temporary 5-minute pre-MFA token
      const mfaToken = jwt.sign(
        { userId: user.id, email: user.email, isPreMfa: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        mfaRequired: true,
        mfaToken,
        message: 'MFA verification required. Please enter code from your authenticator app.',
      });
    }

    // Normal single-step login
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      message: 'Logged in successfully.',
      mfaRequired: false,
      token,
      user: { id: user.id, email: user.email, role: user.role, isActive: user.isActive, mfaEnabled: false },
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}

/**
 * POST /api/auth/mfa/verify-login — Step 2 MFA verification during login
 */
async function verifyMfaLogin(req, res) {
  try {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) {
      return res.status(400).json({ error: 'MFA token and 6-digit code are required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(mfaToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'MFA session expired. Please log in again.' });
    }

    if (!decoded.isPreMfa) {
      return res.status(400).json({ error: 'Invalid MFA verification request.' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive || !user.mfaEnabled) {
      return res.status(401).json({ error: 'Invalid MFA state or user deactivated.' });
    }

    const decryptedSecret = decrypt(user.mfaSecret);
    const cleanCode = code.trim().toUpperCase();

    // Verify TOTP code
    const isTotpValid = Boolean(verifySync({ token: cleanCode, secret: decryptedSecret })?.valid);
    let isBackupValid = false;
    let remainingBackupCodes = [];

    if (!isTotpValid && user.mfaBackupCodes) {
      const backupCodesJson = decrypt(user.mfaBackupCodes);
      const backupCodes = JSON.parse(backupCodesJson || '[]');
      const codeIndex = backupCodes.indexOf(cleanCode);
      if (codeIndex !== -1) {
        isBackupValid = true;
        backupCodes.splice(codeIndex, 1); // Consume backup code
        remainingBackupCodes = backupCodes;
        await prisma.user.update({
          where: { id: user.id },
          data: { mfaBackupCodes: encrypt(JSON.stringify(backupCodes)) },
        });
      }
    }

    if (!isTotpValid && !isBackupValid) {
      return res.status(401).json({ error: 'Invalid MFA verification code or backup code.' });
    }

    // Generate final session token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: isBackupValid ? 'mfa_login_backup_code_used' : 'mfa_login_success',
      entityType: 'User',
      entityId: user.id,
    });

    return res.json({
      message: 'MFA verification successful.',
      token,
      user: { id: user.id, email: user.email, role: user.role, isActive: user.isActive, mfaEnabled: true },
    });
  } catch (err) {
    console.error('[verifyMfaLogin]', err);
    return res.status(500).json({ error: 'Failed to verify MFA code.' });
  }
}

/**
 * POST /api/auth/mfa/setup — Generate TOTP secret and QR code for authenticated user
 */
async function setupMfa(req, res) {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const secret = generateSecret();
    const otpauth = generateURI({ secret, label: user.email, issuer: 'Shadow AI Scanner' });
    const qrCodeUrl = await qrcode.toDataURL(otpauth);
    const backupCodes = generateBackupCodes(8);

    // Save encrypted secret & backup codes temporarily / pending verification
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: encrypt(secret),
        mfaBackupCodes: encrypt(JSON.stringify(backupCodes)),
      },
    });

    return res.json({
      secret,
      qrCodeUrl,
      backupCodes,
      message: 'Scan the QR code in your authenticator app and enter code to activate MFA.',
    });
  } catch (err) {
    console.error('[setupMfa]', err);
    return res.status(500).json({ error: 'Failed to initialize MFA setup.' });
  }
}

/**
 * POST /api/auth/mfa/activate — Confirm TOTP code and enable MFA
 */
async function activateMfa(req, res) {
  try {
    const userId = req.user.userId;
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Verification code is required.' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) {
      return res.status(400).json({ error: 'MFA setup not initialized.' });
    }

    const decryptedSecret = decrypt(user.mfaSecret);
    const isValid = Boolean(verifySync({ token: code.trim(), secret: decryptedSecret })?.valid);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your authenticator app.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'mfa_enabled',
      entityType: 'User',
      entityId: user.id,
    });

    return res.json({ message: 'MFA successfully enabled on your account.' });
  } catch (err) {
    console.error('[activateMfa]', err);
    return res.status(500).json({ error: 'Failed to activate MFA.' });
  }
}

/**
 * POST /api/auth/mfa/disable — Disable MFA for account
 */
async function disableMfa(req, res) {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: null },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'mfa_disabled',
      entityType: 'User',
      entityId: user.id,
    });

    return res.json({ message: 'MFA has been disabled.' });
  } catch (err) {
    console.error('[disableMfa]', err);
    return res.status(500).json({ error: 'Failed to disable MFA.' });
  }
}

/**
 * POST /api/auth/forgot-password — Request password reset link
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // For security, if user doesn't exist, return success message without revealing account absence
    if (!user) {
      return res.json({
        message: 'If an account exists with that email, a password reset link has been dispatched.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: resetToken, passwordResetExpires: resetExpires },
    });

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Shadow AI Scanner',
      html: `<p>Hello,</p><p>You requested a password reset for your Shadow AI Scanner account.</p><p><a href="${resetUrl}">Click here to reset your password</a> (valid for 1 hour).</p>`,
      fallbackUrl: resetUrl,
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'password_reset_requested',
      entityType: 'User',
      entityId: user.id,
    });

    return res.json({
      message: 'Password reset link dispatched.',
      emailSent: emailResult.sent,
      fallbackUrl: emailResult.fallbackUrl,
    });
  } catch (err) {
    console.error('[forgotPassword]', err);
    return res.status(500).json({ error: 'Failed to process forgot password request.' });
  }
}

/**
 * POST /api/auth/reset-password — Confirm password reset with token
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        tokensInvalidBefore: new Date(), // Revoke all previous active JWT sessions
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'password_reset_completed',
      entityType: 'User',
      entityId: user.id,
    });

    return res.json({ message: 'Password reset successful. You may now log in with your new password.' });
  } catch (err) {
    console.error('[resetPassword]', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
}

/**
 * GET /api/auth/sso/config — Check enabled SSO providers
 */
async function ssoConfig(req, res) {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);
  const microsoftEnabled = Boolean(process.env.MICROSOFT_CLIENT_ID);

  return res.json({
    googleEnabled,
    microsoftEnabled,
  });
}

/**
 * POST /api/auth/sso/login — OAuth/SSO login & auto-provisioning
 */
async function ssoLogin(req, res) {
  try {
    const { provider, email, ssoId } = req.body;

    if (!provider || !email || !ssoId) {
      return res.status(400).json({ error: 'Provider, email, and ssoId are required for SSO login.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      // Auto-provision user with 'viewer' role by default
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: 'viewer',
          isActive: true,
          ssoProvider: provider,
          ssoId,
        },
      });

      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: 'sso_user_autoprovisioned',
        entityType: 'User',
        entityId: user.id,
        details: { provider, defaultRole: 'viewer' },
      });
    } else {
      if (!user.isActive) {
        return res.status(403).json({ error: 'Your account has been deactivated by an admin.' });
      }
      // Link SSO provider if not already set
      if (!user.ssoProvider) {
        await prisma.user.update({
          where: { id: user.id },
          data: { ssoProvider: provider, ssoId },
        });
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      message: 'SSO login successful.',
      token,
      user: { id: user.id, email: user.email, role: user.role, isActive: user.isActive, mfaEnabled: user.mfaEnabled },
    });
  } catch (err) {
    console.error('[ssoLogin]', err);
    return res.status(500).json({ error: 'SSO login failed.' });
  }
}

/**
 * GET /api/auth/me
 */
async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true, isActive: true, mfaEnabled: true, ssoProvider: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ error: 'Server error.' });
  }
}

module.exports = {
  signup,
  login,
  verifyMfaLogin,
  setupMfa,
  activateMfa,
  disableMfa,
  forgotPassword,
  resetPassword,
  ssoConfig,
  ssoLogin,
  me,
};
