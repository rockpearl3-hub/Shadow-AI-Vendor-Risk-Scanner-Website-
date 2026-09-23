const { PrismaClient } = require('@prisma/client');
const { assessRisk } = require('../services/riskEngine');
const { assessVendorAlternative } = require('../services/alternativeMatcher');
const { logAuditEvent } = require('../services/auditLogger');

const prisma = new PrismaClient();

/**
 * POST /api/detections
 * Accepts auto-detected AI tool visits from browser extension
 * Body: { domain: string, toolName: string, detectedAt: timestamp }
 */
async function reportDetection(req, res) {
  try {
    const { domain, toolName, detectedAt } = req.body;

    if (!domain || typeof domain !== 'string' || !domain.trim()) {
      return res.status(400).json({ error: 'Valid domain string is required.' });
    }

    if (!toolName || typeof toolName !== 'string' || !toolName.trim()) {
      return res.status(400).json({ error: 'Valid toolName string is required.' });
    }

    const cleanToolName = toolName.trim();
    const timestampStr = detectedAt ? new Date(detectedAt).toISOString() : new Date().toISOString();

    // Check if vendor already exists (case-insensitive)
    const allVendors = await prisma.vendor.findMany({
      include: { suggestedAlternative: true },
    });
    const existingVendor = allVendors.find(
      (v) => v.name.toLowerCase() === cleanToolName.toLowerCase()
    );

    if (existingVendor) {
      return res.status(200).json({
        message: `Vendor '${cleanToolName}' is already tracked in the scanner.`,
        alreadyTracked: true,
        vendor: existingVendor,
      });
    }

    // New vendor payload defaults
    const vendorData = {
      name: cleanToolName,
      category: 'AI Tool',
      dataSensitivity: 'Medium',
      hasCompliance: false,
      hasBreachHistory: false,
      approvedByIT: false,
      notes: `Auto-detected via browser extension on ${timestampStr} (Domain: ${domain.trim()})`,
    };

    // Calculate risk score, risk level, and shadow flag
    const { riskScore, riskLevel, isShadow } = assessRisk(vendorData);

    // Assess suggested alternative matching
    const { suggestedAlternativeId, needsReview } = await assessVendorAlternative(
      isShadow,
      vendorData.category
    );

    const createdVendor = await prisma.vendor.create({
      data: {
        ...vendorData,
        riskScore,
        riskLevel,
        isShadow,
        suggestedAlternativeId,
        needsReview,
      },
      include: { suggestedAlternative: true },
    });

    // Log Audit Event for Extension Auto-Detection
    await logAuditEvent({
      userId: null,
      userEmail: 'Extension Auto-Detection',
      action: 'shadow_detected',
      entityType: 'Vendor',
      entityId: createdVendor.id,
      details: {
        domain: domain.trim(),
        toolName: cleanToolName,
        riskScore,
        riskLevel,
        suggestedAlternative: createdVendor.suggestedAlternative?.approvedToolName || 'None',
      },
    });

    return res.status(201).json({
      message: `Shadow AI vendor '${cleanToolName}' auto-detected and created.`,
      alreadyTracked: false,
      vendor: createdVendor,
    });
  } catch (err) {
    console.error('[reportDetection]', err);
    return res.status(500).json({ error: 'Failed to record detection.' });
  }
}

module.exports = { reportDetection };
