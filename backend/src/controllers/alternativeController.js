const { PrismaClient } = require('@prisma/client');
const {
  findAlternativeForCategory,
  reEvaluateCategoryVendors,
} = require('../services/alternativeMatcher');
const { logAuditEvent } = require('../services/auditLogger');

const prisma = new PrismaClient();

/**
 * GET /api/alternatives — list all approved alternatives
 */
async function getAlternatives(req, res) {
  try {
    const alternatives = await prisma.approvedAlternative.findMany({
      include: {
        _count: {
          select: { vendors: true },
        },
      },
      orderBy: { category: 'asc' },
    });

    return res.json({ alternatives });
  } catch (err) {
    console.error('[getAlternatives]', err);
    return res.status(500).json({ error: 'Failed to fetch approved alternatives.' });
  }
}

/**
 * GET /api/alternatives/:id
 */
async function getAlternativeById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const alternative = await prisma.approvedAlternative.findUnique({
      where: { id },
      include: { vendors: true },
    });

    if (!alternative) {
      return res.status(404).json({ error: 'Approved alternative not found.' });
    }

    return res.json({ alternative });
  } catch (err) {
    console.error('[getAlternativeById]', err);
    return res.status(500).json({ error: 'Failed to fetch alternative.' });
  }
}

/**
 * POST /api/alternatives — create a new approved alternative (Admin only)
 */
async function createAlternative(req, res) {
  try {
    const { category, approvedToolName, approvedToolUrl, notes } = req.body;

    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Category is required.' });
    }

    if (!approvedToolName || typeof approvedToolName !== 'string' || !approvedToolName.trim()) {
      return res.status(400).json({ error: 'Approved tool name is required.' });
    }

    if (!approvedToolUrl || typeof approvedToolUrl !== 'string' || !approvedToolUrl.trim()) {
      return res.status(400).json({ error: 'Approved tool URL is required.' });
    }

    const cleanCategory = category.trim();

    // Check for existing duplicate category (case-insensitive)
    const existing = await findAlternativeForCategory(cleanCategory);
    if (existing) {
      return res.status(400).json({
        error: `An approved alternative for category '${cleanCategory}' already exists ('${existing.approvedToolName}'). Edit the existing entry or use a distinct category.`,
      });
    }

    const alternative = await prisma.approvedAlternative.create({
      data: {
        category: cleanCategory,
        approvedToolName: approvedToolName.trim(),
        approvedToolUrl: approvedToolUrl.trim(),
        notes: notes ? notes.trim() : null,
      },
    });

    // Re-evaluate shadow vendors in this category to link the newly added alternative
    await reEvaluateCategoryVendors(cleanCategory);

    // Audit Logging
    await logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'alternative_added',
      entityType: 'ApprovedAlternative',
      entityId: alternative.id,
      details: {
        category: alternative.category,
        approvedToolName: alternative.approvedToolName,
        approvedToolUrl: alternative.approvedToolUrl,
      },
    });

    return res.status(201).json({
      message: 'Approved alternative created successfully.',
      alternative,
    });
  } catch (err) {
    console.error('[createAlternative]', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'An approved alternative for this category already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create alternative.' });
  }
}

/**
 * PUT /api/alternatives/:id — update an approved alternative (Admin only)
 */
async function updateAlternative(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.approvedAlternative.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Approved alternative not found.' });
    }

    const { category, approvedToolName, approvedToolUrl, notes } = req.body;

    const oldCategory = existing.category;
    const newCategory = category ? category.trim() : existing.category;

    if (newCategory.toLowerCase() !== oldCategory.toLowerCase()) {
      const existingNewCat = await findAlternativeForCategory(newCategory);
      if (existingNewCat && existingNewCat.id !== id) {
        return res.status(400).json({
          error: `An approved alternative for category '${newCategory}' already exists.`,
        });
      }
    }

    const alternative = await prisma.approvedAlternative.update({
      where: { id },
      data: {
        category: newCategory,
        approvedToolName: approvedToolName !== undefined ? approvedToolName.trim() : existing.approvedToolName,
        approvedToolUrl: approvedToolUrl !== undefined ? approvedToolUrl.trim() : existing.approvedToolUrl,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
      },
    });

    // Re-evaluate shadow vendors in old and new categories
    await reEvaluateCategoryVendors(oldCategory);
    if (newCategory !== oldCategory) {
      await reEvaluateCategoryVendors(newCategory);
    }

    // Audit Logging
    await logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'alternative_updated',
      entityType: 'ApprovedAlternative',
      entityId: alternative.id,
      details: {
        old: { category: existing.category, approvedToolName: existing.approvedToolName },
        new: { category: alternative.category, approvedToolName: alternative.approvedToolName },
      },
    });

    return res.json({
      message: 'Approved alternative updated successfully.',
      alternative,
    });
  } catch (err) {
    console.error('[updateAlternative]', err);
    return res.status(500).json({ error: 'Failed to update alternative.' });
  }
}

/**
 * DELETE /api/alternatives/:id — delete an approved alternative (Admin only)
 */
async function deleteAlternative(req, res) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.approvedAlternative.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Approved alternative not found.' });
    }

    const category = existing.category;

    await prisma.approvedAlternative.delete({ where: { id } });

    // Re-evaluate shadow vendors under this category (marks them as needsReview)
    await reEvaluateCategoryVendors(category);

    // Audit Logging
    await logAuditEvent({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      action: 'alternative_deleted',
      entityType: 'ApprovedAlternative',
      entityId: id,
      details: { deletedToolName: existing.approvedToolName, category: existing.category },
    });

    return res.json({ message: 'Approved alternative deleted successfully.' });
  } catch (err) {
    console.error('[deleteAlternative]', err);
    return res.status(500).json({ error: 'Failed to delete alternative.' });
  }
}

/**
 * GET /api/alternatives/category/:category — Public, read-only category lookup endpoint
 */
async function getAlternativeForCategory(req, res) {
  try {
    const category = req.params.category;
    const alternative = await findAlternativeForCategory(category);

    if (!alternative) {
      return res.json({
        found: false,
        category,
        message: `No approved alternative registered for category '${category}' yet.`,
        alternative: null,
      });
    }

    return res.json({
      found: true,
      category,
      alternative,
    });
  } catch (err) {
    console.error('[getAlternativeForCategory]', err);
    return res.status(500).json({ error: 'Failed to lookup alternative for category.' });
  }
}

module.exports = {
  getAlternatives,
  getAlternativeById,
  createAlternative,
  updateAlternative,
  deleteAlternative,
  getAlternativeForCategory,
};
