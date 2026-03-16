/**
 * GramSync — Ledger Routes
 * GET /:customerId — Transaction history for a customer
 */

const express        = require('express');
const authMiddleware = require('../middleware/auth');
const pool           = require('../postgre');
const router         = express.Router();

const DEMO_MODE = process.env.DEMO_MODE === 'true';

// All ledger routes require auth
router.use(authMiddleware);

// ── GET /:customerId — Get transaction history ─────────────────────────────

router.get('/:customerId', async (req, res) => {
  try {
    if (DEMO_MODE) {
      // In demo mode, ledger lives in client IndexedDB
      return res.json({ transactions: [], balance: 0 });
    }

    const { customerId } = req.params;

    const txns = await pool.query(
      `SELECT * FROM transactions
       WHERE merchant_id = $1 AND customer_id = $2
       ORDER BY created_at DESC`,
      [req.merchant.id, customerId]
    );

    // Calculate balance
    let balance = 0;
    for (const t of txns.rows) {
      if (t.type === 'udhar')     balance += t.amount;
      else if (t.type === 'jama') balance -= t.amount;
    }

    res.json({
      transactions: txns.rows,
      balance,
    });
  } catch (err) {
    console.error('[ledger] error:', err);
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
});

module.exports = router;