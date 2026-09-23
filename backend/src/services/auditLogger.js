const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Computes SHA-256 hash for an audit log entry
 */
function computeAuditHash({ previousHash, timestamp, userId, userEmail, action, entityType, entityId, details }) {
  const timestampStr = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  const rawPayload = [
    previousHash || 'GENESIS',
    timestampStr,
    userId || '',
    userEmail || '',
    action || '',
    entityType || '',
    entityId || '',
    details || '',
  ].join('|');

  return crypto.createHash('sha256').update(rawPayload).digest('hex');
}

/**
 * Logs an entry in the AuditLog table with cryptographic hash chaining
 * @param {object} param0 
 * @param {number|null} [param0.userId]
 * @param {string|null} [param0.userEmail]
 * @param {string} param0.action - e.g. "vendor_created", "vendor_approved", "alternative_added", "shadow_detected", "risk_score_changed"
 * @param {string} param0.entityType - "Vendor" | "ApprovedAlternative" | "User" | "Setting"
 * @param {number|null} [param0.entityId]
 * @param {object|string|null} [param0.details] - metadata/diff
 * @param {Date} [param0.timestamp] - Optional custom timestamp (for backfill/migration)
 */
async function logAuditEvent({ userId, userEmail, action, entityType, entityId, details, timestamp }) {
  try {
    const detailsJson = typeof details === 'object' ? JSON.stringify(details) : (details || null);
    const eventTime = timestamp ? new Date(timestamp) : new Date();

    // Fetch previous row to chain the hash
    const lastLog = await prisma.auditLog.findFirst({
      orderBy: { id: 'desc' },
    });

    const previousHash = lastLog ? (lastLog.hash || 'GENESIS') : 'GENESIS';
    const finalUserEmail = userEmail || (userId ? null : 'System / Auto-Detection');

    const currentHash = computeAuditHash({
      previousHash,
      timestamp: eventTime,
      userId: userId || null,
      userEmail: finalUserEmail,
      action,
      entityType,
      entityId: entityId || null,
      details: detailsJson,
    });

    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userEmail: finalUserEmail,
        action,
        entityType,
        entityId: entityId || null,
        details: detailsJson,
        previousHash,
        hash: currentHash,
        timestamp: eventTime,
      },
    });
  } catch (err) {
    console.error('[logAuditEvent Error]', err.message);
    return null;
  }
}

/**
 * Query audit logs with pagination and filters
 */
async function getAuditLogs({ page = 1, limit = 20, action, entityType, entityId, search, startDate, endDate }) {
  const where = {};

  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = parseInt(entityId);
  if (search) {
    where.OR = [
      { action: { contains: search } },
      { userEmail: { contains: search } },
      { details: { contains: search } },
    ];
  }
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / take) || 1,
  };
}

/**
 * Verifies the integrity of the audit log hash chain
 */
async function verifyAuditLogIntegrity() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { id: 'asc' },
    });

    let compromisedCount = 0;
    const compromisedLogs = [];
    let expectedPreviousHash = 'GENESIS';

    for (const log of logs) {
      if (!log.hash) {
        // Skip legacy pre-hashing logs
        continue;
      }

      const currentPreviousHash = log.previousHash || expectedPreviousHash;
      
      const computedHash = computeAuditHash({
        previousHash: currentPreviousHash,
        timestamp: log.timestamp,
        userId: log.userId,
        userEmail: log.userEmail,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
      });

      const isHashValid = log.hash === computedHash;
      const isChainValid = !log.previousHash || log.previousHash === expectedPreviousHash;

      if (!isHashValid || !isChainValid) {
        compromisedCount++;
        compromisedLogs.push({
          id: log.id,
          action: log.action,
          storedHash: log.hash,
          computedHash,
          storedPreviousHash: log.previousHash,
          expectedPreviousHash,
        });
      }

      expectedPreviousHash = log.hash;
    }

    return {
      isIntact: compromisedCount === 0,
      totalChecked: logs.length,
      compromisedCount,
      compromisedLogs,
    };
  } catch (err) {
    console.error('[verifyAuditLogIntegrity Error]', err.message);
    return {
      isIntact: false,
      error: err.message,
    };
  }
}

module.exports = {
  logAuditEvent,
  getAuditLogs,
  verifyAuditLogIntegrity,
  computeAuditHash,
};
