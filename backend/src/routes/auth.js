const express = require('express');
const {
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
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/mfa/verify-login', verifyMfaLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Public SSO config & login
router.get('/sso/config', ssoConfig);
router.post('/sso/login', ssoLogin);

// Protected auth routes
router.get('/me', authMiddleware, me);
router.post('/mfa/setup', authMiddleware, setupMfa);
router.post('/mfa/activate', authMiddleware, activateMfa);
router.post('/mfa/disable', authMiddleware, disableMfa);

module.exports = router;
