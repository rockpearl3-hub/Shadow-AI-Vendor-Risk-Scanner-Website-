/**
 * Backfill Risk Scores
 *
 * One-shot script to recalculate riskScore + riskLevel for all existing
 * vendors using the new 5-factor weighted engine, then persist the updated
 * scores to the database.
 *
 * Run with: node backend/scripts/backfill_risk_scores.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const { calculateVendorRiskScore } = require('../src/services/riskEngine');

const prisma = new PrismaClient();

async function backfill() {
  console.log('\n Backfilling vendor risk scores...\n');

  const vendors = await prisma.vendor.findMany();
  console.log('   Found ' + vendors.length + ' vendor(s) to process.\n');

  let updated = 0;
  let unchanged = 0;

  for (const vendor of vendors) {
    const { riskScore, riskLevel, scoreBreakdown } = calculateVendorRiskScore(vendor);

    if (vendor.riskScore === riskScore && vendor.riskLevel === riskLevel) {
      console.log('   SKIP [' + vendor.id + '] ' + vendor.name + ' -- unchanged (' + riskLevel + ' / ' + riskScore + ')');
      unchanged++;
      continue;
    }

    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { riskScore, riskLevel },
    });

    const breakdown = Object.entries(scoreBreakdown)
      .map(function(entry) { return entry[0] + ':' + entry[1].weighted + '/' + entry[1].max; })
      .join('  ');

    console.log('   UPDATED [' + vendor.id + '] ' + vendor.name);
    console.log('     ' + vendor.riskLevel + '(' + vendor.riskScore + ') -> ' + riskLevel + '(' + riskScore + ')');
    console.log('     ' + breakdown);
    updated++;
  }

  console.log('\n Backfill complete -- ' + updated + ' updated, ' + unchanged + ' unchanged.\n');
}

backfill()
  .catch(function(err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(async function() {
    await prisma.$disconnect();
  });
