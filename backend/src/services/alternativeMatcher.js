const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Finds the best-matching ApprovedAlternative for a given category (case-insensitive)
 * @param {string} category 
 * @returns {Promise<object|null>}
 */
async function findAlternativeForCategory(category) {
  if (!category) return null;
  const cleanCat = category.trim().toLowerCase();

  const alternatives = await prisma.approvedAlternative.findMany();
  return alternatives.find((a) => a.category.trim().toLowerCase() === cleanCat) || null;
}

/**
 * Determines suggestedAlternativeId and needsReview status for a vendor
 * @param {boolean} isShadow 
 * @param {string} category 
 * @returns {Promise<{ suggestedAlternativeId: number|null, needsReview: boolean }>}
 */
async function assessVendorAlternative(isShadow, category) {
  if (!isShadow) {
    return { suggestedAlternativeId: null, needsReview: false };
  }

  const alt = await findAlternativeForCategory(category);
  if (alt) {
    return { suggestedAlternativeId: alt.id, needsReview: false };
  } else {
    return { suggestedAlternativeId: null, needsReview: true };
  }
}

/**
 * Re-evaluates shadow vendors under a given category when alternatives change
 * @param {string} category 
 */
async function reEvaluateCategoryVendors(category) {
  if (!category) return;
  const cleanCat = category.trim().toLowerCase();

  const allVendors = await prisma.vendor.findMany();
  const shadowVendors = allVendors.filter(
    (v) => v.category.trim().toLowerCase() === cleanCat && v.isShadow
  );

  const alt = await findAlternativeForCategory(category);

  for (const vendor of shadowVendors) {
    if (alt) {
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          suggestedAlternativeId: alt.id,
          needsReview: false,
        },
      });
    } else {
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          suggestedAlternativeId: null,
          needsReview: true,
        },
      });
    }
  }
}

module.exports = {
  findAlternativeForCategory,
  assessVendorAlternative,
  reEvaluateCategoryVendors,
};
