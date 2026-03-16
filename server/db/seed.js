/**
 * GramSync — Database Seeder
 * Seeds demo data into PostgreSQL.
 * In DEMO_MODE, demo data is seeded client-side via Auth.js.
 */

require('dotenv').config();
const pool = require('../postgre');
const { v4: uuidv4 } = require('uuid');

const DEMO_MODE = process.env.DEMO_MODE === 'true';

async function seed() {
  if (DEMO_MODE) {
    console.log('[seed] DEMO_MODE is enabled — demo data is seeded client-side.');
    console.log('[seed] Login to the app to see demo customers and transactions.');
    return;
  }

  console.log('[seed] Seeding demo data...');

  try {
    const merchantId = 'merchant_demo_001';

    // Create demo merchant
    await pool.query(
      `INSERT INTO merchants (id, name, phone)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [merchantId, 'Demo Shop', '9876543210']
    );

    // Create demo customers
    const customers = [
      { name: 'Ramesh Kumar',  phone: '9876543210', creditLimit: 1000 },
      { name: 'Sunita Devi',   phone: '9765432109', creditLimit: 500  },
      { name: 'Mohan Lal',     phone: '9654321098', creditLimit: 2000 },
      { name: 'Priya Sharma',  phone: '9543210987', creditLimit: 750  },
      { name: 'Ajay Singh',    phone: '9432109876', creditLimit: 1500 },
    ];

    const customerIds = [];
    for (const c of customers) {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO customers (id, merchant_id, name, phone, credit_limit)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [id, merchantId, c.name, c.phone, c.creditLimit]
      );
      customerIds.push(id);
    }

    // Create demo transactions
    const now = Date.now();
    const day = 86400000;
    const txns = [
      { idx: 0, type: 'udhar', amount: 450, offset: 5 },
      { idx: 0, type: 'udhar', amount: 200, offset: 3 },
      { idx: 0, type: 'jama',  amount: 300, offset: 1 },
      { idx: 1, type: 'udhar', amount: 150, offset: 4 },
      { idx: 1, type: 'jama',  amount: 150, offset: 2 },
      { idx: 2, type: 'udhar', amount: 800, offset: 6 },
      { idx: 2, type: 'udhar', amount: 350, offset: 2 },
      { idx: 3, type: 'udhar', amount: 220, offset: 1 },
    ];

    for (const t of txns) {
      await pool.query(
        `INSERT INTO transactions (id, merchant_id, customer_id, type, amount, created_at)
         VALUES ($1, $2, $3, $4, $5, to_timestamp($6/1000.0))
         ON CONFLICT (id) DO NOTHING`,
        [uuidv4(), merchantId, customerIds[t.idx], t.type, t.amount, now - t.offset * day]
      );
    }

    console.log('[seed] ✓ Demo data seeded successfully.');
  } catch (err) {
    console.error('[seed] ✗ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();