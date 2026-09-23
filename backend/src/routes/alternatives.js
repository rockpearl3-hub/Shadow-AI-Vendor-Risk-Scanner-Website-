const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const {
  getAlternatives,
  getAlternativeById,
  createAlternative,
  updateAlternative,
  deleteAlternative,
  getAlternativeForCategory,
} = require('../controllers/alternativeController');

const router = express.Router();

// Public read-only endpoint for Chrome extension popup & employee notices
router.get('/category/:category', getAlternativeForCategory);

// Protected endpoints (Authenticated users can read)
router.get('/', authMiddleware, getAlternatives);
router.get('/:id', authMiddleware, getAlternativeById);

// Admin-only write endpoints
router.post('/', authMiddleware, requireAdmin, createAlternative);
router.put('/:id', authMiddleware, requireAdmin, updateAlternative);
router.delete('/:id', authMiddleware, requireAdmin, deleteAlternative);

module.exports = router;
