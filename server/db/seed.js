<<<<<<< HEAD
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
=======
require('dotenv').config();
const { query, initSchema } = require('../postgres');

async function seed() {
  console.log('[seed] initialising schema...');
  await initSchema();

  console.log('[seed] inserting demo merchant...');
  const phone = '9999999999';

  await query(`
    INSERT INTO merchants (phone, name)
    VALUES ($1, 'Demo Shop')
    ON CONFLICT (phone) DO UPDATE SET name = 'Demo Shop'
  `, [phone]);

  const merchantRes = await query('SELECT id FROM merchants WHERE phone = $1', [phone]);
  const merchantId  = merchantRes.rows[0].id;
  console.log(`[seed] merchant id: ${merchantId}`);

  console.log('[seed] inserting demo customers...');
  const customers = [
    { name: 'Ramesh Kumar',  phone: '9876543210', limit: 1000 },
    { name: 'Sunita Devi',   phone: '9765432109', limit: 500  },
    { name: 'Mohan Lal',     phone: '9654321098', limit: 2000 },
    { name: 'Priya Sharma',  phone: '9543210987', limit: 750  },
    { name: 'Ajay Singh',    phone: '9432109876', limit: 1500 },
  ];

  const savedIds = [];
  for (const c of customers) {
    const res = await query(`
      INSERT INTO customers (merchant_id, name, phone, credit_limit)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [merchantId, c.name, c.phone, c.limit]);
    if (res.rows.length) savedIds.push(res.rows[0].id);
  }

  if (!savedIds.length) {
    const existing = await query('SELECT id FROM customers WHERE merchant_id = $1', [merchantId]);
    savedIds.push(...existing.rows.map(r => r.id));
  }

  console.log('[seed] inserting demo transactions...');
  const now = Date.now();
  const day  = 86400000;
  const txns = [
    { idx: 0, type: 'udhar', amount: 450, ago: 5 },
    { idx: 0, type: 'udhar', amount: 200, ago: 3 },
    { idx: 0, type: 'jama',  amount: 300, ago: 1 },
    { idx: 1, type: 'udhar', amount: 150, ago: 4 },
    { idx: 1, type: 'jama',  amount: 150, ago: 2 },
    { idx: 2, type: 'udhar', amount: 800, ago: 6 },
    { idx: 2, type: 'udhar', amount: 350, ago: 2 },
    { idx: 3, type: 'udhar', amount: 220, ago: 1 },
  ];

  const { v4: uuidv4 } = require('uuid');
  for (const t of txns) {
    if (!savedIds[t.idx]) continue;
    await query(`
      INSERT INTO transactions (id, merchant_id, customer_id, type, amount, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `, [uuidv4(), merchantId, savedIds[t.idx], t.type, t.amount, now - t.ago * day]);
  }

  console.log(`[seed] done — login with phone: ${phone}, OTP: 123456`);
  process.exit(0);
}

seed().catch(err => {
  console.error('[seed] error:', err.message);
  process.exit(1);
});
>>>>>>> 8c8142ed4a2b349df5d307bf7cb742bdf88cac04
