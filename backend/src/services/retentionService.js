const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Gets retention_days from settings or defaults to 365
 */
async function getRetentionDays() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'retention_days' },
    });
    return setting ? parseInt(setting.value, 10) : 365;
  } catch (err) {
    console.error('[getRetentionDays Error]', err.message);
    return 365;
  }
}

/**
 * Updates retention_days in settings table
 * @param {number} days 
 */
async function setRetentionDays(days) {
  const cleanDays = Math.max(1, parseInt(days, 10));
  return await prisma.setting.upsert({
    where: { key: 'retention_days' },
    update: { value: cleanDays.toString() },
    create: { key: 'retention_days', value: cleanDays.toString() },
  });
}

/**
 * Runs retention cleanup job: deletes AuditLog entries older than retention_days
 */
async function runRetentionCleanup() {
  try {
    const retentionDays = await getRetentionDays();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deleteResult = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[Retention Cleanup] Deleted ${deleteResult.count} audit log entry(s) older than ${retentionDays} days (before ${cutoffDate.toISOString()}).`);
    return {
      success: true,
      retentionDays,
      deletedCount: deleteResult.count,
      cutoffDate,
    };
  } catch (err) {
    console.error('[Retention Cleanup Error]', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = {
  getRetentionDays,
  setRetentionDays,
  runRetentionCleanup,
};
