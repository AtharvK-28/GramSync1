/**
 * GramSync — PostgreSQL Connection Pool
 * In DEMO_MODE, returns a mock pool that logs queries without a real database.
 */

require('dotenv').config();
const { Pool } = require('pg');

const DEMO_MODE = process.env.DEMO_MODE === 'true';

let pool;

if (DEMO_MODE) {
  // Mock pool for demo — no real database required
  pool = {
    query: async (text, params) => {
      console.log('[demo-db] Query skipped (demo mode):', text.slice(0, 80));
      return { rows: [], rowCount: 0 };
    },
    connect: async () => ({
      query: async () => ({ rows: [], rowCount: 0 }),
      release: () => {},
    }),
    end: async () => {},
  };
  console.log('[db] Running in DEMO mode — no PostgreSQL connection.');
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('[db] Unexpected pool error:', err.message);
  });

  pool.query('SELECT NOW()')
    .then(() => console.log('[db] PostgreSQL connected.'))
    .catch(err => console.error('[db] PostgreSQL connection failed:', err.message));
}

module.exports = pool;