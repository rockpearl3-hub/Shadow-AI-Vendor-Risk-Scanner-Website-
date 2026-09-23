const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const {
  getSettings,
  updateSettings,
  triggerAuditVerification,
  triggerRetentionCleanup,
  downloadComplianceReport,
} = require('../controllers/settingsController');

const router = express.Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/verify-audit', triggerAuditVerification);
router.post('/run-retention', triggerRetentionCleanup);
router.get('/compliance-report', downloadComplianceReport);

module.exports = router;
