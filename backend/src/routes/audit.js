const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const { fetchAuditLogs, getVendorHistory } = require('../controllers/auditController');

const router = express.Router();

router.use(authMiddleware);

// Admin-only global audit trail route
router.get('/', requireAdmin, fetchAuditLogs);

// Vendor specific audit timeline (accessible to authenticated users)
router.get('/vendor/:id', getVendorHistory);

module.exports = router;
