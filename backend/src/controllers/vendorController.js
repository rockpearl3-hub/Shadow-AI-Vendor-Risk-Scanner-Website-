const { PrismaClient } = require('@prisma/client');
const { assessRisk, calculateVendorRiskScore } = require('../services/riskEngine');
const { vendorsToCSV, parseVendorCSV } = require('../services/csvService');
const { assessVendorAlternative } = require('../services/alternativeMatcher');
const { logAuditEvent } = require('../services/auditLogger');

const prisma = new PrismaClient();

/**
 * Attaches a virtual `scoreBreakdown` field to a vendor object.
 * The breakdown is computed on-the-fly from stored fields and never persisted in the DB.
 * @param {object} vendor - Prisma vendor row
 * @returns {object} vendor with scoreBreakdown added
 */
function withBreakdown(vendor) {
  const { scoreBreakdown } = calculateVendorRiskScore(vendor);
  return { ...vendor, scoreBreakdown };
}

/**
 * GET /api/vendors — list all vendors (with optional filters)
 */
async function getVendors(req, res) {
  try {
    const { riskLevel, isShadow, category, search } = req.query;

    const where = {};
    if (riskLevel) where.riskLevel = riskLevel;
    if (isShadow !== undefined) where.isShadow = isShadow === 'true';
    if (category) where.category = category;
    if (search) {
      where.name = { contains: search };
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        suggestedAlternative: true,
      },
      orderBy: { riskScore: 'desc' },
    });

    return res.json({ vendors: vendors.map(withBreakdown) });
  } catch (err) {
    console.error('[getVendors]', err);
    return res.status(500).json({ error: 'Failed to fetch vendors.' });
  }
}

/**
 * GET /api/vendors/:id
 */
async function getVendorById(req, res) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        suggestedAlternative: true,
      },
    });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });
    return res.json({ vendor: withBreakdown(vendor) });
  } catch (err) {
    console.error('[getVendorById]', err);
    return res.status(500).json({ error: 'Failed to fetch vendor.' });
  }
}

/**
 * POST /api/vendors — create a new vendor (Admin only)
 */
async function createVendor(req, res) {
  try {
    const { name, category, dataSensitivity, hasCompliance, hasBreachHistory, approvedByIT, notes } = req.body;

    if (!name || !category || !dataSensitivity) {
      return res.status(400).json({ error: 'Name, category, and data sensitivity are required.' });
    }

    const vendorData = {
      name,
      category,
      dataSensitivity,
      hasCompliance: Boolean(hasCompliance),
      hasBreachHistory: Boolean(hasBreachHistory),
      approvedByIT: Boolean(approvedByIT),
      notes: notes || null,
    };

    const { riskScore, riskLevel, isShadow } = assessRisk(vendorData);
    const { suggestedAlternativeId, needsReview } = await assessVendorAlternative(isShadow, vendorData.category);

    const vendor = await prisma.vendor.create({
      data: {
        ...vendorData,
        riskScore,
        riskLevel,
        isShadow,
        suggestedAlternativeId,
        needsReview,
      },
      include: {
        suggestedAlternative: true,
      },
    });

    // Audit Log
    await logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: vendor.approvedByIT ? 'vendor_created' : 'shadow_vendor_created',
      entityType: 'Vendor',
      entityId: vendor.id,
      details: {
        name: vendor.name,
        category: vendor.category,
        riskScore: vendor.riskScore,
        approvedByIT: vendor.approvedByIT,
      },
    });

    return res.status(201).json({ vendor: withBreakdown(vendor) });
  } catch (err) {
    console.error('[createVendor]', err);
    return res.status(500).json({ error: 'Failed to create vendor.' });
  }
}

/**
 * PUT /api/vendors/:id — update a vendor (Admin only)
 */
async function updateVendor(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Vendor not found.' });

    const { name, category, dataSensitivity, hasCompliance, hasBreachHistory, approvedByIT, notes } = req.body;

    const vendorData = {
      name: name ?? existing.name,
      category: category ?? existing.category,
      dataSensitivity: dataSensitivity ?? existing.dataSensitivity,
      hasCompliance: hasCompliance !== undefined ? Boolean(hasCompliance) : existing.hasCompliance,
      hasBreachHistory: hasBreachHistory !== undefined ? Boolean(hasBreachHistory) : existing.hasBreachHistory,
      approvedByIT: approvedByIT !== undefined ? Boolean(approvedByIT) : existing.approvedByIT,
      notes: notes !== undefined ? notes : existing.notes,
    };

    const { riskScore, riskLevel, isShadow } = assessRisk(vendorData);
    const { suggestedAlternativeId, needsReview } = await assessVendorAlternative(isShadow, vendorData.category);

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...vendorData,
        riskScore,
        riskLevel,
        isShadow,
        suggestedAlternativeId,
        needsReview,
      },
      include: {
        suggestedAlternative: true,
      },
    });

    // Log specific actions in Audit Trail
    let actionType = 'vendor_updated';
    if (!existing.approvedByIT && vendor.approvedByIT) {
      actionType = 'vendor_approved';
    } else if (existing.approvedByIT && !vendor.approvedByIT) {
      actionType = 'vendor_unapproved';
    } else if (existing.riskScore !== vendor.riskScore) {
      actionType = 'risk_score_changed';
    }

    await logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: actionType,
      entityType: 'Vendor',
      entityId: vendor.id,
      details: {
        vendorName: vendor.name,
        old: {
          approvedByIT: existing.approvedByIT,
          riskScore: existing.riskScore,
          dataSensitivity: existing.dataSensitivity,
        },
        new: {
          approvedByIT: vendor.approvedByIT,
          riskScore: vendor.riskScore,
          dataSensitivity: vendor.dataSensitivity,
        },
      },
    });

    return res.json({ vendor: withBreakdown(vendor) });
  } catch (err) {
    console.error('[updateVendor]', err);
    return res.status(500).json({ error: 'Failed to update vendor.' });
  }
}

/**
 * DELETE /api/vendors/:id (Admin only)
 */
async function deleteVendor(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Vendor not found.' });

    await prisma.vendor.delete({ where: { id } });

    // Audit Log
    await logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'vendor_deleted',
      entityType: 'Vendor',
      entityId: id,
      details: { deletedVendorName: existing.name, category: existing.category },
    });

    return res.json({ message: 'Vendor deleted successfully.' });
  } catch (err) {
    console.error('[deleteVendor]', err);
    return res.status(500).json({ error: 'Failed to delete vendor.' });
  }
}

/**
 * GET /api/vendors/export/csv — export all vendors as CSV
 */
async function exportCSV(req, res) {
  try {
    const vendors = await prisma.vendor.findMany({
      include: { suggestedAlternative: true },
      orderBy: { riskScore: 'desc' },
    });
    const csv = vendorsToCSV(vendors);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vendor-risk-report.csv"');
    return res.send(csv);
  } catch (err) {
    console.error('[exportCSV]', err);
    return res.status(500).json({ error: 'Failed to export CSV.' });
  }
}

/**
 * POST /api/vendors/import/csv — bulk import vendors from CSV (Admin only)
 */
async function importCSV(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded.' });
    }

    const rows = parseVendorCSV(req.file.buffer);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No valid rows found in CSV.' });
    }

    const created = [];
    for (const row of rows) {
      const { riskScore, riskLevel, isShadow } = assessRisk(row);
      const { suggestedAlternativeId, needsReview } = await assessVendorAlternative(isShadow, row.category);

      const vendor = await prisma.vendor.create({
        data: {
          ...row,
          riskScore,
          riskLevel,
          isShadow,
          suggestedAlternativeId,
          needsReview,
        },
        include: { suggestedAlternative: true },
      });
      created.push(withBreakdown(vendor));

      await logAuditEvent({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'vendor_imported',
        entityType: 'Vendor',
        entityId: vendor.id,
        details: { vendorName: vendor.name, category: vendor.category },
      });
    }

    return res.status(201).json({
      message: `Successfully imported ${created.length} vendor(s).`,
      vendors: created,
    });
  } catch (err) {
    console.error('[importCSV]', err);
    return res.status(500).json({ error: 'Failed to import CSV: ' + err.message });
  }
}

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  exportCSV,
  importCSV,
};
