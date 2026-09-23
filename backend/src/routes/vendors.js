const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  exportCSV,
  importCSV,
} = require('../controllers/vendorController');

const router = express.Router();

// Multer: store CSV in memory
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// All vendor routes require authentication
router.use(authMiddleware);

// Read-only routes (Viewers + Admins)
router.get('/', getVendors);
router.get('/export/csv', exportCSV);
router.get('/:id', getVendorById);

// Admin-only write routes
router.post('/', requireAdmin, createVendor);
router.post('/import/csv', requireAdmin, upload.single('file'), importCSV);
router.put('/:id', requireAdmin, updateVendor);
router.delete('/:id', requireAdmin, deleteVendor);

module.exports = router;
