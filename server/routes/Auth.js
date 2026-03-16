/**
 * GramSync — Auth Routes
 * POST /send-otp   — Send OTP to phone
 * POST /verify-otp — Verify OTP and return JWT
 */

const express = require('express');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

const DEMO_MODE  = process.env.DEMO_MODE === 'true';
const JWT_SECRET = process.env.JWT_SECRET || 'gramsync_dev_secret';

// In-memory OTP store (production: use Redis or DB)
const otpStore = new Map();

// ── Send OTP ───────────────────────────────────────────────────────────────

router.post('/send-otp', async (req, res) => {
  try {
    const { phone, deviceId } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    if (DEMO_MODE) {
      // Demo mode: store a fixed OTP
      otpStore.set(phone, { otp: '123456', expires: Date.now() + 600000 });
      return res.json({ message: 'OTP sent (demo mode — use any 6 digits)', demo: true });
    }

    // Production: generate and send OTP via SMS provider
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(phone, { otp, expires: Date.now() + 600000 }); // 10 min expiry

    // TODO: Wire to SMS API (Twilio, MSG91, etc.)
    console.log(`[auth] OTP for ${phone}: ${otp}`);

    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('[auth] send-otp error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ── Verify OTP ─────────────────────────────────────────────────────────────

router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, deviceId } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    if (DEMO_MODE) {
      // Demo mode: accept any 6-digit OTP
      if (otp.length !== 6) {
        return res.status(400).json({ error: 'OTP must be 6 digits' });
      }

      const token = jwt.sign(
        { id: 'merchant_demo_001', phone },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        merchant: {
          id:    'merchant_demo_001',
          name:  'Demo Shop',
          phone,
          token,
        }
      });
    }

    // Production: verify OTP from store
    const stored = otpStore.get(phone);
    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Clear used OTP
    otpStore.delete(phone);

    // Issue JWT
    const merchantId = 'merchant_' + phone;
    const token = jwt.sign(
      { id: merchantId, phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      merchant: {
        id:    merchantId,
        name:  'My Shop',
        phone,
        token,
      }
    });
  } catch (err) {
    console.error('[auth] verify-otp error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;