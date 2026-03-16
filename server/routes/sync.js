/**
 * GramSync — Sync Routes
 * Receives batched data from the client's sync engine.
 * POST /push — receive items (customers + transactions) from client
 * GET  /pull — return server-side data for client merge
 */

const express        = require('express');
const authMiddleware = require('../middleware/auth');
const pool           = require('../postgre');
const router         = express.Router();

const DEMO_MODE = process.env.DEMO_MODE === 'true';

// All sync routes require auth
router.use(authMiddleware);

// ── POST /push — Receive sync batch from client ────────────────────────────

router.post('/push', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array required' });
    }

    if (DEMO_MODE) {
      // In demo mode, acknowledge everything as synced
      const synced = items.map(item => item.id);
      console.log(`[sync] Demo mode — acknowledged ${synced.length} items`);
      return res.json({ synced, conflicts: [] });
    }

    // Production: upsert each item into PostgreSQL
    const synced = [];
    const conflicts = [];

    for (const item of items) {
      try {
        if (item.store === 'customers') {
          await pool.query(
            `INSERT INTO customers (id, merchant_id, name, phone, credit_limit, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, to_timestamp($6/1000.0), NOW())
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               phone = EXCLUDED.phone,
               credit_limit = EXCLUDED.credit_limit,
               updated_at = NOW()`,
            [item.data.id, item.data.merchantId, item.data.name,
             item.data.phone, item.data.creditLimit, item.data.createdAt]
          );
        } else if (item.store === 'transactions') {
          await pool.query(
            `INSERT INTO transactions (id, merchant_id, customer_id, type, amount, created_at)
             VALUES ($1, $2, $3, $4, $5, to_timestamp($6/1000.0))
             ON CONFLICT (id) DO NOTHING`,
            [item.data.id, item.data.merchantId, item.data.customerId,
             item.data.type, item.data.amount, item.data.createdAt]
          );
        }
        synced.push(item.id);
      } catch (err) {
        console.error(`[sync] Failed to sync item ${item.id}:`, err.message);
        conflicts.push({ id: item.id, error: err.message });
      }
    }

    res.json({ synced, conflicts });
  } catch (err) {
    console.error('[sync] push error:', err);
    res.status(500).json({ error: 'Sync push failed' });
  }
});

// ── GET /pull — Return server data for client merge ────────────────────────

router.get('/pull', async (req, res) => {
  try {
    const since = parseInt(req.query.since) || 0;

    if (DEMO_MODE) {
      return res.json({ customers: [], transactions: [] });
    }

    const customers = await pool.query(
      `SELECT * FROM customers WHERE merchant_id = $1 AND updated_at > to_timestamp($2/1000.0)`,
      [req.merchant.id, since]
    );

    const transactions = await pool.query(
      `SELECT * FROM transactions WHERE merchant_id = $1 AND created_at > to_timestamp($2/1000.0)`,
      [req.merchant.id, since]
    );

    res.json({
      customers: customers.rows,
      transactions: transactions.rows,
    });
  } catch (err) {
    console.error('[sync] pull error:', err);
    res.status(500).json({ error: 'Sync pull failed' });
  }
});

module.exports = router;