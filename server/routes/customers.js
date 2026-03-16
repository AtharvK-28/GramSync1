/**
 * GramSync — Customer Routes
 * CRUD operations for customers.
 * In DEMO_MODE, data lives only in client IndexedDB.
 * These endpoints support the sync engine.
 */

const express        = require('express');
const authMiddleware = require('../middleware/auth');
const pool           = require('../postgre');
const router         = express.Router();

const DEMO_MODE = process.env.DEMO_MODE === 'true';

// All routes require auth
router.use(authMiddleware);

// ── GET / — List merchant's customers ──────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    if (DEMO_MODE) {
      // In demo mode, customers live in client IndexedDB
      return res.json({ customers: [] });
    }

    const result = await pool.query(
      'SELECT * FROM customers WHERE merchant_id = $1 ORDER BY name',
      [req.merchant.id]
    );
    res.json({ customers: result.rows });
  } catch (err) {
    console.error('[customers] list error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ── POST / — Create or update a customer ───────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { id, name, phone, creditLimit } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (DEMO_MODE) {
      return res.json({
        customer: { id, name, phone, creditLimit, merchantId: req.merchant.id }
      });
    }

    const result = await pool.query(
      `INSERT INTO customers (id, merchant_id, name, phone, credit_limit, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET name = $3, phone = $4, credit_limit = $5, updated_at = NOW()
       RETURNING *`,
      [id, req.merchant.id, name, phone || '', creditLimit || 500]
    );
    res.json({ customer: result.rows[0] });
  } catch (err) {
    console.error('[customers] create error:', err);
    res.status(500).json({ error: 'Failed to save customer' });
  }
});

// ── GET /:id — Get single customer ─────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    if (DEMO_MODE) {
      return res.json({ customer: null });
    }

    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1 AND merchant_id = $2',
      [req.params.id, req.merchant.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ customer: result.rows[0] });
  } catch (err) {
    console.error('[customers] get error:', err);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

module.exports = router;
