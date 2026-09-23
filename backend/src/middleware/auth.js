const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * JWT authentication middleware with DB-level session revocation & active user checks.
 * Expects: Authorization: Bearer <token>
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to verify active status & token revocation timestamp
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true, tokensInvalidBefore: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated by an admin.' });
    }

    // Session Revocation Check: If token was issued BEFORE tokensInvalidBefore timestamp
    if (user.tokensInvalidBefore && decoded.iat) {
      const issuedAtMs = decoded.iat * 1000;
      const invalidBeforeMs = new Date(user.tokensInvalidBefore).getTime();
      if (issuedAtMs < invalidBeforeMs) {
        return res.status(401).json({ error: 'Session invalidated. Please log in again.' });
      }
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in.' });
  }
}

/**
 * Require admin role middleware
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
}

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.requireAdmin = requireAdmin;
