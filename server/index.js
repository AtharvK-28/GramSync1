require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const authRoutes     = require('./routes/auth');
const syncRoutes     = require('./routes/sync');
const customerRoutes = require('./routes/customers');
const ledgerRoutes   = require('./routes/ledger');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // allow inline scripts in PWA
}));

app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5500',
  credentials: true,
}));

// ── Rate limiting ──────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      500,
  message:  { error: 'Too many requests, slow down.' }
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max:      5,               // max 5 OTP requests per 10 min per IP
  message:  { error: 'Too many OTP requests. Try again in 10 minutes.' }
});

app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));

// ── Serve client (static) ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../client')));

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',      otpLimiter, authRoutes);
app.use('/api/sync',      syncRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/ledger',    ledgerRoutes);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: Date.now(), mode: process.env.DEMO_MODE === 'true' ? 'demo' : 'live' });
});

// ── SPA fallback — serve index.html for all non-API routes ────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │  GramSync server running                │
  │  http://localhost:${PORT}                  │
  │  Mode: ${process.env.DEMO_MODE === 'true' ? 'DEMO (no real SMS/DB)  ' : 'LIVE                   '}│
  └─────────────────────────────────────────┘
  `);
});

module.exports = app;