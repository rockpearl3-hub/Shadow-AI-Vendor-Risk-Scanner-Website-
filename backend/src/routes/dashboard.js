const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getStats, getAlerts } = require('../controllers/dashboardController');

const router = express.Router();

router.use(authMiddleware);

// GET /api/dashboard/stats
router.get('/stats', getStats);

// GET /api/dashboard/alerts
router.get('/alerts', getAlerts);

module.exports = router;
