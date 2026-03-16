/**
 * GramSync — Sync Engine
 * Pushes pending IndexedDB changes to the server.
 * Updates the sync status pill in the header.
 */

const SYNC_API = '/api/sync';
let syncInterval = null;

// ── Sync loop ──────────────────────────────────────────────────────────────

function startSyncLoop() {
  // Run immediately, then every 30s
  runSync().catch(() => {});
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    runSync().catch(() => {});
  }, 30000);
}

async function runSync() {
  const pill = document.getElementById('header-sync-status');

  // If offline, just show offline status
  if (!navigator.onLine) {
    updateSyncPill('offline');
    return;
  }

  try {
    const pending = await getPendingSyncItems();

    if (!pending.length) {
      updateSyncPill('ok');
      return;
    }

    updateSyncPill('pending');

    const token = localStorage.getItem('gs_token');

    // Batch push
    const res = await fetch(SYNC_API + '/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (token || ''),
      },
      body: JSON.stringify({ items: pending }),
    });

    if (res.ok) {
      // Mark all as synced
      for (const item of pending) {
        await markSynced(item.id);
      }
      updateSyncPill('ok');
    } else {
      // Server rejected — mark as failed
      for (const item of pending) {
        await markSyncFailed(item.id);
      }
      updateSyncPill('error');
    }
  } catch (err) {
    // Network error — stay pending
    updateSyncPill('offline');
  }
}

// ── UI sync pill ───────────────────────────────────────────────────────────

function updateSyncPill(status) {
  const pill = document.getElementById('header-sync-status');
  if (!pill) return;

  const config = {
    ok:      { cls: 'sync-ok',      text: '● synced'  },
    pending: { cls: 'sync-pending', text: '● syncing' },
    offline: { cls: 'sync-offline', text: '● offline' },
    error:   { cls: 'sync-error',   text: '● error'   },
  };

  const c = config[status] || config.pending;
  pill.className = 'sync-pill ' + c.cls;
  pill.textContent = c.text;
}

// Listen for online/offline events
window.addEventListener('online',  () => { updateSyncPill('pending'); runSync().catch(() => {}); });
window.addEventListener('offline', () => { updateSyncPill('offline'); });