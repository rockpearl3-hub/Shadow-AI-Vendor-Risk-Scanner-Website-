const { PrismaClient } = require('@prisma/client');
const { assessVendorAlternative } = require('../src/services/alternativeMatcher');

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🚀 Starting Phase 4 Data Migration Script...');

  try {
    // 1. Assign "admin" role to all existing users
    console.log('Step 1: Assigning "admin" role to existing users...');
    const userUpdateResult = await prisma.user.updateMany({
      where: { role: { not: 'admin' } },
      data: { role: 'admin', isActive: true },
    });
    console.log(`✓ Updated ${userUpdateResult.count} user(s) to "admin" role.`);

    // 2. Re-run category-matching logic for unlinked shadow vendors
    console.log('Step 2: Re-matching shadow vendors missing suggested alternatives...');
    const shadowVendors = await prisma.vendor.findMany({
      where: { isShadow: true, suggestedAlternativeId: null },
    });

    let reMatchedCount = 0;
    for (const vendor of shadowVendors) {
      const { suggestedAlternativeId, needsReview } = await assessVendorAlternative(true, vendor.category);
      if (suggestedAlternativeId) {
        await prisma.vendor.update({
          where: { id: vendor.id },
          data: { suggestedAlternativeId, needsReview },
        });
        reMatchedCount++;
      }
    }
    console.log(`✓ Re-matched ${reMatchedCount} shadow vendor(s) with suggested alternatives.`);

    // 3. Backfill AuditLog entries for existing vendors
    console.log('Step 3: Backfilling AuditLog entries for existing vendors...');
    const allVendors = await prisma.vendor.findMany();
    let auditBackfillCount = 0;

    for (const vendor of allVendors) {
      const existingLog = await prisma.auditLog.findFirst({
        where: { entityType: 'Vendor', entityId: vendor.id, action: { in: ['vendor_created', 'shadow_detected', 'shadow_vendor_created'] } },
      });

      if (!existingLog) {
        await prisma.auditLog.create({
          data: {
            userId: null,
            userEmail: 'System Migration Script',
            action: vendor.isShadow ? 'shadow_detected' : 'vendor_created',
            entityType: 'Vendor',
            entityId: vendor.id,
            details: JSON.stringify({
              name: vendor.name,
              category: vendor.category,
              riskScore: vendor.riskScore,
              approvedByIT: vendor.approvedByIT,
              notes: 'Historical entry backfilled via Phase 4 migration script',
            }),
            timestamp: vendor.createdAt,
          },
        });
        auditBackfillCount++;
      }
    }
    console.log(`✓ Backfilled ${auditBackfillCount} historical audit log entry(s).`);

    console.log('🎉 Phase 4 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
