/**
 * GramSync — Auth Module
 * OTP-based login. In demo mode, any 6-digit OTP works.
 * Production: replace DEMO_MODE=false and wire to your backend.
 */

const AUTH_API  = '/api/auth';
const DEMO_MODE = true;

// ── Send OTP ───────────────────────────────────────────────────────────────

async function sendOTP() {
  const phone = document.getElementById('phone-input').value.trim();

  if (!/^[6-9]\d{9}$/.test(phone)) {
    showToast('Enter valid 10-digit mobile number', 'error');
    return;
  }

  const btn = document.getElementById('btn-send-otp');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  try {
    if (!DEMO_MODE) {
      await fetch(AUTH_API + '/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, deviceId: getDeviceId() })
      });
    }

    // Show OTP step
    document.getElementById('auth-step-phone').classList.add('hidden');
    document.getElementById('auth-step-otp').classList.remove('hidden');
    document.getElementById('otp-phone-display').textContent = phone;

    if (DEMO_MODE) showToast('Demo: use any 6 digits', 'info');

    // Auto-focus first OTP box
    setupOTPBoxes();
    document.querySelectorAll('.otp-box')[0].focus();

  } catch (err) {
    showToast('Failed to send OTP. Try again.', 'error');
  } finally {
    btn.textContent = 'Get OTP →';
    btn.disabled = false;
  }
}

// ── OTP box auto-advance ───────────────────────────────────────────────────

function setupOTPBoxes() {
  const boxes = document.querySelectorAll('.otp-box');
  boxes.forEach((box, i) => {
    box.value = '';
    box.oninput = () => {
      if (box.value.length === 1 && i < boxes.length - 1) {
        boxes[i + 1].focus();
      }
    };
    box.onkeydown = (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].focus();
      }
    };
  });
}

// ── Verify OTP ─────────────────────────────────────────────────────────────

async function verifyOTP() {
  const otp = Array.from(document.querySelectorAll('.otp-box'))
    .map(b => b.value).join('');

  if (otp.length < 6) {
    showToast('Enter complete 6-digit OTP', 'error');
    return;
  }

  const btn = document.getElementById('btn-verify-otp');
  btn.textContent = 'Verifying…';
  btn.disabled = true;

  try {
    if (DEMO_MODE) {
      // Demo: accept any 6-digit OTP
      const demoMerchant = {
        id:       'merchant_demo_001',
        name:     'Demo Shop',
        phone:    document.getElementById('otp-phone-display').textContent,
        token:    'demo_token_' + Date.now()
      };
      await loginSuccess(demoMerchant);
    } else {
      const phone = document.getElementById('otp-phone-display').textContent;
      const res   = await fetch(AUTH_API + '/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, otp, deviceId: getDeviceId() })
      });
      if (!res.ok) throw new Error('Invalid OTP');
      const data = await res.json();
      await loginSuccess(data.merchant);
    }
  } catch (err) {
    showToast('Invalid OTP. Try again.', 'error');
    btn.textContent = 'Verify & Login →';
    btn.disabled = false;
  }
}

// ── Login success ──────────────────────────────────────────────────────────

async function loginSuccess(merchant) {
  localStorage.setItem('gs_merchant_id', merchant.id);
  localStorage.setItem('gs_merchant_name', merchant.name);
  localStorage.setItem('gs_token', merchant.token);

  // Seed demo data on first login
  const existing = await getCustomersByMerchant(merchant.id);
  if (!existing.length) {
    await seedDemoData(merchant.id);
  }

  showApp();
}

// ── Check existing session ─────────────────────────────────────────────────

function checkSession() {
  const token = localStorage.getItem('gs_token');
  const mId   = localStorage.getItem('gs_merchant_id');
  return !!(token && mId);
}

function getMerchantId() {
  return localStorage.getItem('gs_merchant_id');
}

// ── Demo seed data ─────────────────────────────────────────────────────────

async function seedDemoData(merchantId) {
  const customers = [
    { name: 'Ramesh Kumar',   phone: '9876543210', creditLimit: 1000 },
    { name: 'Sunita Devi',    phone: '9765432109', creditLimit: 500  },
    { name: 'Mohan Lal',      phone: '9654321098', creditLimit: 2000 },
    { name: 'Priya Sharma',   phone: '9543210987', creditLimit: 750  },
    { name: 'Ajay Singh',     phone: '9432109876', creditLimit: 1500 },
  ];

  const savedCustomers = [];
  for (const c of customers) {
    const saved = await saveCustomer({ ...c, merchantId });
    savedCustomers.push(saved);
  }

  // Seed some historical transactions
  const now = Date.now();
  const day  = 86400000;
  const txns = [
    { customerId: savedCustomers[0].id, type: 'udhar', amount: 450, createdAt: now - 5*day },
    { customerId: savedCustomers[0].id, type: 'udhar', amount: 200, createdAt: now - 3*day },
    { customerId: savedCustomers[0].id, type: 'jama',  amount: 300, createdAt: now - 1*day },
    { customerId: savedCustomers[1].id, type: 'udhar', amount: 150, createdAt: now - 4*day },
    { customerId: savedCustomers[1].id, type: 'jama',  amount: 150, createdAt: now - 2*day },
    { customerId: savedCustomers[2].id, type: 'udhar', amount: 800, createdAt: now - 6*day },
    { customerId: savedCustomers[2].id, type: 'udhar', amount: 350, createdAt: now - 2*day },
    { customerId: savedCustomers[3].id, type: 'udhar', amount: 220, createdAt: now - 1*day },
  ];

  for (const t of txns) {
    const txn = await saveTransaction({ ...t, merchantId, id: uuid() });
    // Mark old ones as synced
    txn.syncStatus = 'synced';
    await dbPut('transactions', txn);
    // Remove from sync queue (already "synced")
    const item = await dbGet('sync_queue', txn.id);
    if (item) { item.status = 'synced'; await dbPut('sync_queue', item); }
  }
}