const express = require('express');
const { reportDetection } = require('../controllers/detectionController');

const router = express.Router();

// POST /api/detections — unauthenticated endpoint for browser extension auto-detection
router.post('/', reportDetection);

module.exports = router;
