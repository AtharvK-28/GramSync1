/**
 * GramSync — IndexedDB Data Layer
 * Offline-first storage for customers, transactions, and sync queue.
 */

const DB_NAME = 'gramsync';
const DB_VERSION = 1;
let _db = null;

// ── Open / Upgrade ─────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Customers store
      if (!db.objectStoreNames.contains('customers')) {
        const cs = db.createObjectStore('customers', { keyPath: 'id' });
        cs.createIndex('merchantId', 'merchantId', { unique: false });
        cs.createIndex('phone', 'phone', { unique: false });
      }

      // Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const ts = db.createObjectStore('transactions', { keyPath: 'id' });
        ts.createIndex('merchantId', 'merchantId', { unique: false });
        ts.createIndex('customerId', 'customerId', { unique: false });
        ts.createIndex('merchantCustomer', ['merchantId', 'customerId'], { unique: false });
      }

      // Sync queue
      if (!db.objectStoreNames.contains('sync_queue')) {
        const sq = db.createObjectStore('sync_queue', { keyPath: 'id' });
        sq.createIndex('status', 'status', { unique: false });
      }
    };

    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };

    req.onerror = (e) => reject(e.target.error);
  });
}

// Auto-init on load
openDB().catch(err => console.error('[db] Failed to open IndexedDB:', err));

// ── Generic helpers ────────────────────────────────────────────────────────

async function dbPut(storeName, record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function dbGet(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function dbGetAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function dbGetAllByIndex(storeName, indexName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(key);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function dbDelete(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

// ── UUID ───────────────────────────────────────────────────────────────────

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Device ID (persistent per browser) ─────────────────────────────────────

function getDeviceId() {
  let id = localStorage.getItem('gs_device_id');
  if (!id) {
    id = 'device_' + uuid();
    localStorage.setItem('gs_device_id', id);
  }
  return id;
}

// ── Customer operations ────────────────────────────────────────────────────

async function saveCustomer(data) {
  const customer = {
    id:          data.id || uuid(),
    merchantId:  data.merchantId,
    name:        data.name,
    phone:       data.phone || '',
    creditLimit: data.creditLimit || 500,
    createdAt:   data.createdAt || Date.now(),
    updatedAt:   Date.now(),
    syncStatus:  data.syncStatus || 'pending',
  };

  await dbPut('customers', customer);

  // Add to sync queue
  await dbPut('sync_queue', {
    id:        customer.id,
    store:     'customers',
    action:    'upsert',
    data:      customer,
    status:    'pending',
    createdAt: Date.now(),
  });

  return customer;
}

async function getCustomersByMerchant(merchantId) {
  return dbGetAllByIndex('customers', 'merchantId', merchantId);
}

async function getCustomerBalance(merchantId, customerId) {
  const txns = await dbGetAllByIndex('transactions', 'merchantCustomer', [merchantId, customerId]);
  let balance = 0;
  for (const t of txns) {
    if (t.type === 'udhar') balance += t.amount;
    else if (t.type === 'jama') balance -= t.amount;
  }
  return balance;
}

// ── Transaction operations ─────────────────────────────────────────────────

async function saveTransaction(data) {
  const txn = {
    id:          data.id || uuid(),
    merchantId:  data.merchantId,
    customerId:  data.customerId,
    type:        data.type,       // 'udhar' or 'jama'
    amount:      data.amount,
    createdAt:   data.createdAt || Date.now(),
    syncStatus:  data.syncStatus || 'pending',
  };

  await dbPut('transactions', txn);

  // Add to sync queue
  await dbPut('sync_queue', {
    id:        txn.id,
    store:     'transactions',
    action:    'create',
    data:      txn,
    status:    'pending',
    createdAt: Date.now(),
  });

  return txn;
}

async function getTransactionsByCustomer(merchantId, customerId) {
  const txns = await dbGetAllByIndex('transactions', 'merchantCustomer', [merchantId, customerId]);
  // Sort by date, newest first
  txns.sort((a, b) => b.createdAt - a.createdAt);
  return txns;
}

// ── Sync queue helpers ─────────────────────────────────────────────────────

async function getPendingSyncItems() {
  return dbGetAllByIndex('sync_queue', 'status', 'pending');
}

async function markSynced(id) {
  const item = await dbGet('sync_queue', id);
  if (item) {
    item.status = 'synced';
    await dbPut('sync_queue', item);
  }
  // Also update the original record
  const record = await dbGet(item?.store, id);
  if (record) {
    record.syncStatus = 'synced';
    await dbPut(item.store, record);
  }
}

async function markSyncFailed(id) {
  const item = await dbGet('sync_queue', id);
  if (item) {
    item.status = 'failed';
    item.retries = (item.retries || 0) + 1;
    await dbPut('sync_queue', item);
  }
}
