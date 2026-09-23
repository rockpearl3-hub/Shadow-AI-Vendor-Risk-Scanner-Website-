const { getAuditLogs } = require('../services/auditLogger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/audit-logs — List audit logs with pagination and filtering (Admin only)
 */
async function fetchAuditLogs(req, res) {
  try {
    const { page, limit, action, entityType, search, startDate, endDate } = req.query;

    const result = await getAuditLogs({
      page,
      limit,
      action,
      entityType,
      search,
      startDate,
      endDate,
    });

    return res.json(result);
  } catch (err) {
    console.error('[fetchAuditLogs]', err);
    return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
}

/**
 * GET /api/vendors/:id/history — Vendor specific audit timeline
 */
async function getVendorHistory(req, res) {
  try {
    const vendorId = parseInt(req.params.id);

    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Vendor',
        entityId: vendorId,
      },
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
    });

    return res.json({ vendorId, history: logs });
  } catch (err) {
    console.error('[getVendorHistory]', err);
    return res.status(500).json({ error: 'Failed to fetch vendor history.' });
  }
}

module.exports = {
  fetchAuditLogs,
  getVendorHistory,
};
