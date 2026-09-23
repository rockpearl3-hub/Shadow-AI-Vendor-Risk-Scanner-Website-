/**
 * Risk Scoring Engine — 5-Factor Weighted Model
 *
 * Calculates a 0–100 composite risk score for a vendor.
 * Higher score = higher risk.
 *
 * Weighting:
 *   30% — Data Sensitivity    (what data can the vendor access?)
 *   20% — Auth Method         (how do users authenticate?)
 *   20% — Security Posture    (compliance certs + breach history)
 *   15% — Blast Radius        (how many users/departments use it?)
 *   15% — AI Data Risk        (does it train on user data?)
 *
 * Risk Level thresholds:
 *   0–39   → "Low"
 *   40–69  → "Medium"
 *   70–89  → "High"
 *   90–100 → "Critical"
 *
 * Fields used from vendorData:
 *   - dataSensitivity   String  "Low" | "Medium" | "High"
 *   - authMethod        String? "sso" | "password" | "personal_email"  (defaults inferred)
 *   - hasCompliance     Boolean
 *   - hasBreachHistory  Boolean
 *   - approvedByIT      Boolean
 *   - userCount         Int?    number of active users            (defaults to 0)
 *   - aiDataRisk        String? "no_training"|"opt_out"|"trains_by_default" (defaults inferred)
 *   - isShadow          Boolean (derived from approvedByIT if not set)
 *   - category          String  used for AI-risk inference
 */

// ─── Sub-scorers (each returns 0–100 raw score before weighting) ────────────

/**
 * Factor 1: Data Sensitivity — 30% weight
 * What kind of data does the vendor access?
 */
function scoreDataSensitivity(vendor) {
  switch ((vendor.dataSensitivity || 'Low').toLowerCase()) {
    case 'high':   return 100; // PII, source code, financial data
    case 'medium': return 50;  // Internal business data
    case 'low':
    default:       return 10;  // Public or non-sensitive data
  }
}

/**
 * Factor 2: Auth Method — 20% weight
 * How do users authenticate to the vendor?
 * If authMethod is not stored yet, infer from approvedByIT.
 */
function scoreAuthMethod(vendor) {
  // Infer auth method from approvedByIT if not explicitly set
  let authMethod = vendor.authMethod;
  if (!authMethod) {
    authMethod = vendor.approvedByIT ? 'sso' : 'personal_email';
  }

  switch (authMethod.toLowerCase()) {
    case 'sso':
    case 'saml':
    case 'oauth_corp':    return 10;  // Corporate SSO / SAML — lowest risk
    case 'password':      return 50;  // Password-based — moderate risk
    case 'personal_email':
    default:              return 90;  // Personal email signup — highest risk
  }
}

/**
 * Factor 3: Security Posture — 20% weight
 * Does the vendor have compliance certs? Any breach history?
 */
function scoreSecurityPosture(vendor) {
  let score = 50; // baseline — unknown posture
  if (vendor.hasCompliance)     score -= 40; // SOC 2 / ISO 27001 = strong signal
  if (vendor.hasBreachHistory)  score += 50; // Known breach = major red flag
  return Math.min(100, Math.max(0, score));
}

/**
 * Factor 4: Blast Radius — 15% weight
 * How many active users/departments does this vendor touch?
 * If userCount not stored, infer: approved = moderate, shadow = unknown/low.
 */
function scoreBlastRadius(vendor) {
  const count = vendor.userCount != null ? vendor.userCount : (vendor.approvedByIT ? 10 : 1);

  if (count >= 500) return 100;
  if (count >= 200) return 80;
  if (count >= 50)  return 60;
  if (count >= 10)  return 40;
  if (count >= 1)   return 20;
  return 5; // 0 known users — minimal blast radius
}

/**
 * Factor 5: AI Data Risk — 15% weight
 * Does the vendor train on user data? Is it an unsanctioned shadow tool?
 * Inferred from category + approvedByIT if aiDataRisk field not stored.
 */
function scoreAiDataRisk(vendor) {
  let aiDataRisk = vendor.aiDataRisk;
  const isAiTool = (vendor.category || '').toLowerCase().includes('ai');
  const isShadow = vendor.isShadow != null ? vendor.isShadow : !vendor.approvedByIT;

  if (!aiDataRisk) {
    if (!isAiTool) {
      aiDataRisk = 'no_training';        // Non-AI tools don't train on data
    } else if (isShadow) {
      aiDataRisk = 'trains_by_default';  // Unapproved AI tool — assume worst case
    } else {
      aiDataRisk = 'opt_out';            // Approved AI tool — assume opted out
    }
  }

  switch (aiDataRisk.toLowerCase()) {
    case 'no_training':
    case 'enterprise_agreement': return 5;  // Enterprise no-training agreement
    case 'opt_out':              return 40; // User must opt out manually
    case 'trains_by_default':
    default:                     return 95; // Trains by default / shadow AI tool
  }
}

// ─── Composite scorer ────────────────────────────────────────────────────────

/**
 * Computes the full weighted risk score + breakdown for a vendor.
 *
 * @param {object} vendorData
 * @returns {{
 *   riskScore: number,
 *   riskLevel: string,
 *   isShadow: boolean,
 *   scoreBreakdown: {
 *     dataSensitivity:  { raw: number, weighted: number, max: number },
 *     authMethod:       { raw: number, weighted: number, max: number },
 *     securityPosture:  { raw: number, weighted: number, max: number },
 *     blastRadius:      { raw: number, weighted: number, max: number },
 *     aiDataRisk:       { raw: number, weighted: number, max: number },
 *   }
 * }}
 */
function calculateVendorRiskScore(vendorData) {
  const WEIGHTS = {
    dataSensitivity: 0.30,
    authMethod:      0.20,
    securityPosture: 0.20,
    blastRadius:     0.15,
    aiDataRisk:      0.15,
  };

  const rawScores = {
    dataSensitivity: scoreDataSensitivity(vendorData),
    authMethod:      scoreAuthMethod(vendorData),
    securityPosture: scoreSecurityPosture(vendorData),
    blastRadius:     scoreBlastRadius(vendorData),
    aiDataRisk:      scoreAiDataRisk(vendorData),
  };

  let totalScore = 0;
  const scoreBreakdown = {};

  for (const [factor, weight] of Object.entries(WEIGHTS)) {
    const raw = rawScores[factor];
    const weighted = Math.round(raw * weight);
    const max = Math.round(100 * weight);
    scoreBreakdown[factor] = { raw, weighted, max };
    totalScore += weighted;
  }

  // Clamp to 0–100
  const riskScore = Math.min(100, Math.max(0, totalScore));
  const riskLevel = getRiskLevel(riskScore);
  const isShadow = !vendorData.approvedByIT;

  return { riskScore, riskLevel, isShadow, scoreBreakdown };
}

function getRiskLevel(score) {
  if (score >= 90) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

/**
 * Legacy-compatible wrapper used by vendorController.
 * @param {object} vendorData
 * @returns {{ riskScore: number, riskLevel: string, isShadow: boolean, scoreBreakdown: object }}
 */
function assessRisk(vendorData) {
  return calculateVendorRiskScore(vendorData);
}

module.exports = {
  assessRisk,
  calculateVendorRiskScore,
  getRiskLevel,
};
