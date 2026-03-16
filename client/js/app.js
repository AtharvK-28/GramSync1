const state = {
    amount: '',
    selectedCustomer: null,
    merchantId: null,
    customers: [],
    filteredCustomers: []
};

// ── Boot sequence ──────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', async () => {
    // Animate splash loader, then boot
    setTimeout(async () => {
        const splash = document.getElementById('splash');
        splash.classList.add('fade-out');
        setTimeout(() => { splash.classList.add('hidden'); }, 400);
        await boot();
    }, 2000);
});

async function boot() {
    state.merchantId = getMerchantId();

    if (checkSession()) {
        await showApp();
    } else {
        document.getElementById('screen-auth').classList.remove('hidden');
    }
}

async function showApp() {
    state.merchantId = getMerchantId();

    document.getElementById('screen-auth').classList.add('hidden');
    document.getElementById('screen-app').classList.remove('hidden');

    await loadCustomers();
    startSyncLoop();
    renderHome();
}

// ── View routing ───────────────────────────────────────────────────────────

let viewTimeout = null;

function showView(name) {
    if (viewTimeout) clearTimeout(viewTimeout);
    
    document.querySelectorAll('.view').forEach(v => {
        if (v.id === 'view-' + name) {
            v.classList.remove('hidden', 'leave');
            v.classList.add('active');
            requestAnimationFrame(() => v.classList.add('enter'));
        } else if (v.classList.contains('active')) {
            v.classList.remove('enter');
            v.classList.add('leave');
            viewTimeout = setTimeout(() => {
                if (!v.classList.contains('enter')) {
                    v.classList.remove('active', 'leave');
                    v.classList.add('hidden');
                }
            }, 250); // Match CSS transition time
        } else {
            v.classList.remove('active', 'enter', 'leave');
            v.classList.add('hidden');
        }
    });

    // Update bottom nav
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    if (navItems.length) {
        navItems.forEach(btn => btn.classList.remove('active'));
        if (name === 'home') navItems[0].classList.add('active');
        if (name === 'customers') navItems[1].classList.add('active');
        if (name === 'ledger') navItems[2].classList.add('active');
    }
}

function openCustomerList() {
    loadCustomerListView();
    showView('customers');
}

async function openLedger(customerId) {
    if (customerId) {
        await loadLedger(customerId);
    }
    showView('ledger');
}

// ── Dashboard / Home ───────────────────────────────────────────────────────

async function renderHome() {
    showView('home');

    // Calculate sum of all positive balances (Credit given to customers)
    const totalCredit = state.customers.reduce((sum, c) => {
        return sum + (c.balance > 0 ? c.balance : 0);
    }, 0);
    
    document.getElementById('dash-total-credit').textContent = '₹' + totalCredit.toLocaleString('en-IN');

    let udharToday = 0;
    let jamaToday = 0;
    const todayStr = new Date().toDateString();
    let recentTxns = [];

    for (const c of state.customers) {
        const txns = await getTransactionsByCustomer(state.merchantId, c.id);
        const todayTxns = txns.filter(t => new Date(t.createdAt).toDateString() === todayStr);
        udharToday += todayTxns.filter(t => t.type === 'udhar').length;
        jamaToday += todayTxns.filter(t => t.type === 'jama').length;
        
        txns.forEach(t => t.customerName = c.name);
        recentTxns.push(...txns);
    }
    
    document.getElementById('dash-udhar-count').textContent = udharToday;
    document.getElementById('dash-jama-count').textContent = jamaToday;

    // Speed Dial (Top customers by absolute balance)
    const topCustomers = [...state.customers]
        .filter(c => Math.abs(c.balance || 0) > 0)
        .sort((a, b) => Math.abs(b.balance || 0) - Math.abs(a.balance || 0))
        .slice(0, 5);

    const sdEl = document.getElementById('dash-speed-dial');
    if (!topCustomers.length) {
        sdEl.style.display = 'none';
        sdEl.previousElementSibling.style.display = 'none'; // hide 'Quick Access' header
    } else {
        sdEl.style.display = '';
        sdEl.previousElementSibling.style.display = '';
        sdEl.innerHTML = topCustomers.map(c => {
            const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return `
            <div class="sd-item" onclick="openLedger('${c.id}')">
                <div class="sd-avatar">${initials}</div>
                <div class="sd-name">${escHtml(c.name)}</div>
            </div>`;
        }).join('');
    }

    recentTxns.sort((a, b) => b.createdAt - a.createdAt);
    const topRecent = recentTxns.slice(0, 5);

    const listEl = document.getElementById('dash-recent-list');
    if (!topRecent.length) {
        listEl.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <p>No recent activity.<br>Transactions will appear here.</p>
        </div>`;
    } else {
        listEl.innerHTML = topRecent.map(t => {
            const date = new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const time = new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const typeHi = t.type === 'udhar' ? 'उधार' : 'जमा';
            const badgeCls = t.type === 'udhar' ? 'badge-udhar' : 'badge-jama';
            const amtColor = t.type === 'udhar' ? 'var(--udhar)' : 'var(--jama)';
            const syncDot = t.syncStatus === 'synced' ? 'dot-synced' : t.syncStatus === 'failed' ? 'dot-failed' : 'dot-pending';

            return `
            <div class="txn-row" style="margin-bottom: 8px;">
                <div class="txn-left">
                    <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 4px; color: var(--text);">${escHtml(t.customerName)}</div>
                    <div>
                        <span class="txn-type-badge ${badgeCls}">${typeHi} ${t.type.toUpperCase()}</span>
                        <span class="txn-date">${date} · ${time}</span>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="txn-amount" style="color:${amtColor}">₹${t.amount.toLocaleString('en-IN')}</span>
                    <span class="txn-sync-dot ${syncDot}" title="${t.syncStatus}"></span>
                </div>
            </div>`;
        }).join('');
    }
}

// ── POS keypad ─────────────────────────────────────────────────────────────

function renderPOS() { showView('pos'); updateAmountDisplay(); }

function keyPress(val) {
    if (state.amount.length >= 7) return; // max ₹99,99,999
    if (val === '00' && !state.amount) return;
    if (state.amount === '0') { state.amount = val === '00' ? '0' : val; }
    else { state.amount += val; }
    updateAmountDisplay();
}

function keyDel() {
    state.amount = state.amount.slice(0, -1);
    updateAmountDisplay();
}

function updateAmountDisplay() {
    const el = document.getElementById('amount-value');
    const val = state.amount || '0';
    el.textContent = Number(val).toLocaleString('en-IN');
    el.classList.toggle('has-amount', !!state.amount);
}

// ── Transaction commit ─────────────────────────────────────────────────────

async function commitTransaction(type) {
    const amount = parseInt(state.amount, 10);

    if (!amount || amount <= 0) {
        showToast('Enter an amount first', 'error');
        shakeAmount();
        return;
    }

    if (!state.selectedCustomer) {
        showToast('Select a customer first', 'error');
        document.getElementById('customer-bar').style.borderColor = 'var(--udhar)';
        setTimeout(() => {
            document.getElementById('customer-bar').style.borderColor = '';
        }, 1000);
        openCustomerPicker();
        return;
    }

    // Fraud cap: offline udhar limit check
    if (type === 'udhar' && !navigator.onLine) {
        const balance = await getCustomerBalance(state.merchantId, state.selectedCustomer.id);
        const newBalance = balance + amount;
        if (newBalance > (state.selectedCustomer.creditLimit || 500)) {
            showToast(`Offline credit limit: ₹${state.selectedCustomer.creditLimit || 500}`, 'error');
            return;
        }
    }

    // Optimistic commit: save locally immediately, UI returns instantly
    const txn = await saveTransaction({
        merchantId: state.merchantId,
        customerId: state.selectedCustomer.id,
        type,
        amount
    });

    // Reset state
    state.amount = '';
    updateAmountDisplay();

    // Update customer bar balance
    await refreshCustomerBar();

    // Show confirmation toast
    const sign = type === 'udhar' ? '-' : '+';
    const color = type === 'udhar' ? 'error' : 'success';
    showToast(`${type === 'udhar' ? 'उधार' : 'जमा'} ₹${amount.toLocaleString('en-IN')} saved`, color);

    // Reload customers list in background
    await loadCustomers();

    // Trigger sync attempt (non-blocking)
    runSync().catch(() => { });
}

function shakeAmount() {
    const el = document.getElementById('amount-value');
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake 0.3s ease';
    el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
}

// ── Customer bar ───────────────────────────────────────────────────────────

function openCustomerPicker() {
    state.filteredCustomers = [...state.customers];
    renderPickerList(state.customers);
    document.getElementById('picker-search').value = '';
    document.getElementById('modal-customer-picker').classList.remove('hidden');
    setTimeout(() => document.getElementById('picker-search').focus(), 100);
}

async function selectCustomer(customer) {
    state.selectedCustomer = customer;
    closeModal('modal-customer-picker');
    await refreshCustomerBar();
}

async function refreshCustomerBar() {
    const bar = document.getElementById('customer-bar');
    const inner = document.getElementById('customer-bar-inner');

    if (!state.selectedCustomer) {
        inner.className = 'customer-bar-none';
        inner.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Tap to select customer`;
        return;
    }

    const balance = await getCustomerBalance(state.merchantId, state.selectedCustomer.id);
    const balClass = balance > 0 ? 'balance-positive' : balance < 0 ? 'balance-negative' : 'balance-zero';
    const balLabel = balance > 0 ? 'owes you' : balance < 0 ? 'overpaid' : 'settled';

    inner.className = 'customer-bar-selected';
    inner.innerHTML = `
    <div>
      <div class="customer-bar-name">${escHtml(state.selectedCustomer.name)}</div>
      <div class="customer-bar-meta">${state.selectedCustomer.phone || 'No phone'}</div>
    </div>
    <div>
      <div class="customer-bar-balance ${balClass}">₹${Math.abs(balance).toLocaleString('en-IN')}</div>
      <div style="font-size:0.68rem;color:var(--text-3);text-align:right">${balLabel}</div>
    </div>
  `;
}

// ── Customer list ──────────────────────────────────────────────────────────

async function loadCustomers() {
    state.customers = await getCustomersByMerchant(state.merchantId);

    // Attach balance to each (for display)
    for (const c of state.customers) {
        c.balance = await getCustomerBalance(state.merchantId, c.id);
    }

    // Sort: highest balance (owes most) first
    state.customers.sort((a, b) => b.balance - a.balance);
}

function loadCustomerListView() {
    state.filteredCustomers = [...state.customers];
    renderCustomerList(state.customers);
}

function filterCustomers(q) {
    const filtered = q
        ? state.customers.filter(c =>
            c.name.toLowerCase().includes(q.toLowerCase()) ||
            (c.phone && c.phone.includes(q)))
        : state.customers;
    renderCustomerList(filtered);
}

function filterPicker(q) {
    const filtered = q
        ? state.customers.filter(c =>
            c.name.toLowerCase().includes(q.toLowerCase()) ||
            (c.phone && c.phone.includes(q)))
        : state.customers;
    renderPickerList(filtered);
}

function renderCustomerList(customers) {
    const el = document.getElementById('customer-list');
    if (!customers.length) {
        el.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <p>No customers yet.<br>Add your first customer to start tracking.</p>
        </div>`;
        return;
    }
    el.innerHTML = customers.map(c => customerCardHTML(c, false)).join('');
}

function renderPickerList(customers) {
    const el = document.getElementById('picker-list');
    if (!customers.length) {
        el.innerHTML = `
        <div class="empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>No matching customers.</p>
        </div>`;
        return;
    }
    el.innerHTML = customers.map(c => customerCardHTML(c, true)).join('');
}

function customerCardHTML(c, forPicker) {
    const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const balance = c.balance || 0;
    const balClass = balance > 0 ? 'balance-positive' : balance < 0 ? 'balance-negative' : 'balance-zero';
    const balLabel = balance > 0 ? 'owes' : balance < 0 ? 'advance' : 'clear';
    const onclick = forPicker
        ? `selectCustomer(${JSON.stringify(c).replace(/"/g, '&quot;')})`
        : `openLedger('${c.id}')`;

    return `
    <div class="customer-card" onclick="${onclick}">
      <div class="ccard-left">
        <div class="ccard-avatar">${initials}</div>
        <div>
          <div class="ccard-name">${escHtml(c.name)}</div>
          <div class="ccard-phone">${c.phone || 'No phone'}</div>
        </div>
      </div>
      <div>
        <div class="ccard-balance ${balClass}">₹${Math.abs(balance).toLocaleString('en-IN')}</div>
        <div class="ccard-balance-label">${balLabel}</div>
      </div>
    </div>
  `;
}

// ── Add customer ───────────────────────────────────────────────────────────

function openAddCustomer() {
    closeModal('modal-customer-picker');
    document.getElementById('new-customer-name').value = '';
    document.getElementById('new-customer-phone').value = '';
    document.getElementById('new-customer-limit').value = '500';
    document.getElementById('modal-add-customer').classList.remove('hidden');
    setTimeout(() => document.getElementById('new-customer-name').focus(), 100);
}

async function saveNewCustomer() {
    const name = document.getElementById('new-customer-name').value.trim();
    const phone = document.getElementById('new-customer-phone').value.trim();
    const limit = parseInt(document.getElementById('new-customer-limit').value, 10) || 500;

    if (!name) { showToast('Enter customer name', 'error'); return; }

    const customer = await saveCustomer({
        merchantId: state.merchantId,
        name, phone, creditLimit: limit
    });

    closeModal('modal-add-customer');
    await loadCustomers();
    showToast(`${name} added`, 'success');

    // Auto-select if we came from the POS
    if (document.getElementById('view-pos').classList.contains('active') ||
        document.getElementById('view-pos').style.display !== 'none') {
        await selectCustomer(customer);
    }
}

// ── Ledger ─────────────────────────────────────────────────────────────────

async function loadLedger(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    document.getElementById('ledger-title').textContent = customer.name;

    const txns = await getTransactionsByCustomer(state.merchantId, customerId);
    const balance = customer.balance || 0;
    const totalUdhar = txns.filter(t => t.type === 'udhar').reduce((s, t) => s + t.amount, 0);
    const totalJama = txns.filter(t => t.type === 'jama').reduce((s, t) => s + t.amount, 0);

    const balClass = balance > 0 ? 'balance-positive' : balance < 0 ? 'balance-negative' : 'balance-zero';

    let reminderBtn = '';
    if (balance > 0 && customer.phone) {
        const msg = encodeURIComponent(`Namaste ${customer.name}, a gentle reminder that your pending balance is ₹${balance.toLocaleString('en-IN')}. Please settle it soon. Thank you!`);
        reminderBtn = `
        <button class="wa-btn" onclick="window.open('https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${msg}', '_blank')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Send Reminder
        </button>`;
    }

    document.getElementById('ledger-summary').innerHTML = `
    <div class="ledger-stat">
      <div class="ledger-stat-label">Balance</div>
      <div class="ledger-stat-value ${balClass}">₹${Math.abs(balance).toLocaleString('en-IN')}</div>
    </div>
    <div class="ledger-stat">
      <div class="ledger-stat-label">Transactions</div>
      <div class="ledger-stat-value">${txns.length}</div>
    </div>
    <div class="ledger-stat" style="grid-column: 1 / -1; margin-top: 8px;">
        ${reminderBtn}
    </div>
  `;

    if (!txns.length) {
        document.getElementById('ledger-list').innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p>No transactions yet.<br>Start adding udhar or jama.</p>
        </div>`;
        return;
    }

    document.getElementById('ledger-list').innerHTML = txns.map(t => {
        const date = new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const time = new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const typeHi = t.type === 'udhar' ? 'उधार' : 'जमा';
        const badgeCls = t.type === 'udhar' ? 'badge-udhar' : 'badge-jama';
        const amtColor = t.type === 'udhar' ? 'var(--udhar)' : 'var(--jama)';
        const syncDot = t.syncStatus === 'synced' ? 'dot-synced' : t.syncStatus === 'failed' ? 'dot-failed' : 'dot-pending';

        return `
      <div class="txn-row">
        <div class="txn-left">
          <span class="txn-type-badge ${badgeCls}">${typeHi} ${t.type.toUpperCase()}</span>
          <span class="txn-date">${date} · ${time}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="txn-amount" style="color:${amtColor}">₹${t.amount.toLocaleString('en-IN')}</span>
          <span class="txn-sync-dot ${syncDot}" title="${t.syncStatus}"></span>
        </div>
      </div>
    `;
    }).join('');
}

// ── QR Scanner (mock — wire to jsQR in production) ────────────────────────

function startQRScan() {
    closeModal('modal-customer-picker');
    document.getElementById('qr-overlay').classList.remove('hidden');

    // Mock: simulate a successful scan after 2s
    setTimeout(() => {
        stopQRScan();
        // In production: decode QR token, look up customer by qrToken
        if (state.customers.length) {
            const randomCustomer = state.customers[Math.floor(Math.random() * state.customers.length)];
            selectCustomer(randomCustomer);
            showToast(`QR scanned: ${randomCustomer.name}`, 'success');
        } else {
            showToast('Unknown QR card', 'error');
        }
    }, 2000);
}

function stopQRScan() {
    document.getElementById('qr-overlay').classList.add('hidden');
}

// ── Modals ─────────────────────────────────────────────────────────────────

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
    }
});

// ── Toast ──────────────────────────────────────────────────────────────────

let toastTimer = null;
function showToast(msg, type = 'info') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast toast-${type}`;
    el.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2500);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function escHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Add shake keyframe dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-8px); }
    40%     { transform: translateX(8px); }
    60%     { transform: translateX(-5px); }
    80%     { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);