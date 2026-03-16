/**
 * GramSync — Database Migration
 * Creates the required tables in PostgreSQL.
 * Skip in DEMO_MODE since data lives in client IndexedDB.
 */

require('dotenv').config();
const pool = require('../postgre');

const DEMO_MODE = process.env.DEMO_MODE === 'true';

async function migrate() {
  if (DEMO_MODE) {
    console.log('[migrate] DEMO_MODE is enabled — no database migration needed.');
    console.log('[migrate] All data is stored locally in IndexedDB.');
    return;
  }

  console.log('[migrate] Running database migrations...');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS merchants (
        id          VARCHAR(64) PRIMARY KEY,
        name        VARCHAR(255) NOT NULL DEFAULT 'My Shop',
        phone       VARCHAR(15) NOT NULL UNIQUE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id            VARCHAR(64) PRIMARY KEY,
        merchant_id   VARCHAR(64) NOT NULL,
        name          VARCHAR(255) NOT NULL,
        phone         VARCHAR(15) DEFAULT '',
        credit_limit  INTEGER DEFAULT 500,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_merchant ON customers(merchant_id);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id            VARCHAR(64) PRIMARY KEY,
        merchant_id   VARCHAR(64) NOT NULL,
        customer_id   VARCHAR(64) NOT NULL REFERENCES customers(id),
        type          VARCHAR(10) NOT NULL CHECK (type IN ('udhar', 'jama')),
        amount        INTEGER NOT NULL CHECK (amount > 0),
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
    `);

    console.log('[migrate] ✓ All tables created successfully.');
  } catch (err) {
    console.error('[migrate] ✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();