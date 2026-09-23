const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/dashboard/stats
 * Returns overview metrics for the dashboard.
 */
async function getStats(req, res) {
  try {
    const [total, shadow, high, medium, low] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isShadow: true } }),
      prisma.vendor.count({ where: { riskLevel: 'High' } }),
      prisma.vendor.count({ where: { riskLevel: 'Medium' } }),
      prisma.vendor.count({ where: { riskLevel: 'Low' } }),
    ]);

    // Category breakdown
    const categoryRaw = await prisma.vendor.groupBy({
      by: ['category'],
      _count: { id: true },
    });
    const byCategory = categoryRaw.map((c) => ({
      category: c.category,
      count: c._count.id,
    }));

    return res.json({
      total,
      shadow,
      riskDistribution: { High: high, Medium: medium, Low: low },
      byCategory,
    });
  } catch (err) {
    console.error('[getStats]', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
}

/**
 * GET /api/dashboard/alerts
 * Returns vendors that are High Risk or Shadow.
 */
async function getAlerts(req, res) {
  try {
    const alerts = await prisma.vendor.findMany({
      where: {
        OR: [{ riskLevel: 'High' }, { isShadow: true }],
      },
      orderBy: { riskScore: 'desc' },
    });

    return res.json({ alerts });
  } catch (err) {
    console.error('[getAlerts]', err);
    return res.status(500).json({ error: 'Failed to fetch alerts.' });
  }
}

module.exports = { getStats, getAlerts };
