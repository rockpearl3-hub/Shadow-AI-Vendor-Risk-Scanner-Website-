require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { runRetentionCleanup } = require('./services/retentionService');

const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const dashboardRoutes = require('./routes/dashboard');
const detectionsRoutes = require('./routes/detections');
const alternativesRoutes = require('./routes/alternatives');
const usersRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const settingsRoutes = require('./routes/settings');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/detections', detectionsRoutes);
app.use('/api/alternatives', alternativesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/settings', settingsRoutes);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ─── Startup ─────────────────────────────────────────────────────────────────
async function main() {
  // Auto-run migrations on startup — creates DB and tables if they don't exist
  try {
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', {
      cwd: __dirname + '/../',
      stdio: 'inherit',
    });
  } catch (e) {
    console.warn('⚠️  Migration warning (non-fatal):', e.message);
  }

  await prisma.$connect();
  console.log('✅ Database connected');

  // Initial audit log retention cleanup run & 24h interval timer
  runRetentionCleanup().catch((err) => console.error('Initial retention cleanup error:', err.message));
  setInterval(() => {
    runRetentionCleanup().catch((err) => console.error('Scheduled retention cleanup error:', err.message));
  }, 24 * 60 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`🚀 Shadow AI Scanner API running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { app, prisma };
