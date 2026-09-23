const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { logAuditEvent } = require('../services/auditLogger');
const { sendEmail } = require('../services/emailService');

const prisma = new PrismaClient();

/**
 * GET /api/users — List all users (Admin only)
 */
async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
        ssoProvider: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (err) {
    console.error('[getUsers]', err);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
}

/**
 * POST /api/users — Create/invite new user (Admin only)
 */
async function createUser(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanRole = role === 'admin' ? 'admin' : 'viewer';
    const existing = await prisma.user.findUnique({ where: { email: email.trim() } });

    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        email: email.trim(),
        passwordHash,
        role: cleanRole,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Send invitation email (or return fallback)
    const emailResult = await sendEmail({
      to: newUser.email,
      subject: 'Invitation to Shadow AI & Vendor Risk Scanner',
      html: `<p>Hello,</p><p>You have been invited to join the Shadow AI Scanner portal as a <b>${newUser.role}</b>.</p><p>Please log in using your email: <b>${newUser.email}</b></p>`,
      fallbackUrl: `${process.env.APP_URL || 'http://localhost:5173'}/login`,
    });

    // Log Audit Event
    await logAuditEvent({
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'user_created',
      entityType: 'User',
      entityId: newUser.id,
      details: { createdUserEmail: newUser.email, role: newUser.role, emailSent: emailResult.sent },
    });

    return res.status(201).json({
      message: 'User created successfully.',
      user: newUser,
      inviteEmail: emailResult,
    });
  } catch (err) {
    console.error('[createUser]', err);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
}

/**
 * PUT /api/users/:id — Update user role or active status (Admin only)
 */
async function updateUser(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { role, isActive } = req.body;

    const updatedData = {};
    if (role !== undefined) updatedData.role = role === 'admin' ? 'admin' : 'viewer';
    if (isActive !== undefined) {
      updatedData.isActive = Boolean(isActive);
      // On deactivation or status update, invalidate active sessions
      if (isActive === false) {
        updatedData.tokensInvalidBefore = new Date();
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatedData,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Log Audit Event
    await logAuditEvent({
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'user_updated',
      entityType: 'User',
      entityId: updatedUser.id,
      details: { old: { role: existing.role, isActive: existing.isActive }, new: updatedData },
    });

    return res.json({
      message: 'User updated successfully.',
      user: updatedUser,
    });
  } catch (err) {
    console.error('[updateUser]', err);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
}

/**
 * DELETE /api/users/:id — Delete user (Admin only)
 */
async function deleteUser(req, res) {
  try {
    const id = parseInt(req.params.id);

    if (id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await prisma.user.delete({ where: { id } });

    // Log Audit Event
    await logAuditEvent({
      userId: req.user.userId,
      userEmail: req.user.email,
      action: 'user_deleted',
      entityType: 'User',
      entityId: id,
      details: { deletedEmail: existing.email },
    });

    return res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('[deleteUser]', err);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
