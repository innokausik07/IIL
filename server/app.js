require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Static files (uploaded images) ───────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Serve React Build (production) ───────────────────────────────────────────
// In Plesk, the client build will be inside the 'public' folder next to app.js
const clientBuild = path.join(__dirname, 'public');
app.use(express.static(clientBuild));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/users',         require('./routes/users.routes'));
app.use('/api/locations',     require('./routes/locations.routes'));
app.use('/api/navigation',    require('./routes/navigation.routes'));
app.use('/api/pincode',       require('./routes/pincode.routes'));
app.use('/api/masters',       require('./routes/masters.routes'));
app.use('/api/google-sheet',  require('./routes/googleSheet.routes'));
app.use('/api/moved-sheet',   require('./routes/movedSheet.routes'));
app.use('/api/cross-audit',   require('./routes/crossAudit.routes'));
app.use('/api/store-stock',   require('./routes/storeStock.routes'));
app.use('/api/sync',          require('./routes/sync.routes'));      // Called by Google Apps Script

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── React SPA fallback — serve index.html for all non-API routes ─────────────
app.get('*', (req, res) => {
  const indexPath = path.join(clientBuild, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ status: 'error', message: `Route ${req.path} not found` });
    }
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ status: 'error', message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 ERP Server running on http://localhost:${PORT}`);
  console.log(`📡 API base: http://localhost:${PORT}/api`);
  console.log(`🌐 React app served from ${clientBuild}`);
});

module.exports = app;
