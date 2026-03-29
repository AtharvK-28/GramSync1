// App.jsx
// GramSync Merchant App — Root navigator
// Wires HomeDashboard, CustomersList, ScanQR, TransactionKeypad
// together with a lightweight client-side router (no react-router needed).
//
// Usage:
//   import App from "./App";
//   ReactDOM.createRoot(document.getElementById("root")).render(<App />);
//
// File tree expected:
//   src/
//     App.jsx                  ← this file
//     screens/
//       HomeDashboard.jsx
//       CustomersList.jsx
//       ScanQR.jsx
//       TransactionKeypad.jsx

import { useState, useCallback, useEffect, useRef } from "react";
import HomeDashboard      from "./screens/HomeDashboard";
import CustomersList      from "./screens/CustomersList";
import CustomerProfile    from "./screens/CustomerProfile";
import ReportsDashboard   from "./screens/ReportsDashboard";
import ScanQR             from "./screens/ScanQR";
import TransactionKeypad  from "./screens/TransactionKeypad";

// ─── Screen registry ──────────────────────────────────────────────
const SCREENS = {
  home:            "home",
  customers:       "customers",
  customerProfile: "customerProfile",
  reports:         "reports",
  scan:            "scan",
  keypad:          "keypad",
};

// ─── Transition config ────────────────────────────────────────────
const TRANSITION_MS = 220;

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  html, body, #root { height: 100%; }
  body { background: #E8EAF2; font-family: 'Sora', sans-serif; display: flex; justify-content: center; }
  ::-webkit-scrollbar { display: none; }

  @keyframes slideInRight {
    from { transform: translateX(32px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes slideInLeft {
    from { transform: translateX(-32px); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
  }
  @keyframes slideInUp {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes fadeScreen {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .screen-enter-right { animation: slideInRight ${TRANSITION_MS}ms cubic-bezier(.22,1,.36,1) forwards; }
  .screen-enter-left  { animation: slideInLeft  ${TRANSITION_MS}ms cubic-bezier(.22,1,.36,1) forwards; }
  .screen-enter-up    { animation: slideInUp    ${TRANSITION_MS}ms cubic-bezier(.22,1,.36,1) forwards; }
  .screen-enter-fade  { animation: fadeScreen   ${TRANSITION_MS}ms ease forwards; }
`;

// ─── Direction heuristic ──────────────────────────────────────────
// Decides which animation plays based on screen order.
const SCREEN_ORDER = [SCREENS.home, SCREENS.customers, SCREENS.customerProfile, SCREENS.reports, SCREENS.scan, SCREENS.keypad];

function getTransitionClass(from, to) {
  if (to === SCREENS.scan)   return "screen-enter-up";   // scan always slides up
  if (to === SCREENS.keypad && from === SCREENS.scan) return "screen-enter-left";
  const fromIdx = SCREEN_ORDER.indexOf(from);
  const toIdx   = SCREEN_ORDER.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return "screen-enter-fade";
  return toIdx > fromIdx ? "screen-enter-right" : "screen-enter-left";
}

// ─── useRouter ────────────────────────────────────────────────────
function useRouter(initial = SCREENS.home) {
  const [current,  setCurrent]  = useState(initial);
  const [previous, setPrevious] = useState(null);
  const [anim,     setAnim]     = useState("screen-enter-fade");
  const [params,   setParams]   = useState({});   // per-screen state payload

  const navigate = useCallback((screenId, screenParams = {}) => {
    if (screenId === current) return;
    setAnim(getTransitionClass(current, screenId));
    setPrevious(current);
    setCurrent(screenId);
    setParams(screenParams);
  }, [current]);

  const goBack = useCallback(() => {
    if (previous) navigate(previous);
  }, [previous, navigate]);

  return { current, previous, anim, params, navigate, goBack };
}

// ─── Toast notification ───────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <div style={{
      position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)",
      background: "#0D1226", color: "#fff",
      padding: "10px 20px", borderRadius: 99,
      fontSize: 13, fontWeight: 600,
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      zIndex: 999,
      transition: "opacity 0.25s ease, transform 0.25s ease",
      opacity: visible ? 1 : 0,
      transform: `translateX(-50%) translateY(${visible ? 0 : 10}px)`,
      pointerEvents: "none",
      whiteSpace: "nowrap",
      fontFamily: "'Sora', sans-serif",
    }}>
      {message}
    </div>
  );
}

function useToast() {
  const [toast,    setToast]   = useState({ message: "", visible: false });
  const timerRef = useRef(null);

  const showToast = useCallback((message) => {
    clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2600);
  }, []);

  return { toast, showToast };
}

// ─── App state ────────────────────────────────────────────────────
// Central store — lightweight alternative to Redux/Zustand for this app.
function useAppState() {
  const [syncOnline,           setSyncOnline]           = useState(true);
  const [transactions,         setTransactions]         = useState([]);
  const [selectedCustomer,     setSelectedCustomer]     = useState(null);
  const [notifications,        setNotifications]        = useState(1);

  const addTransaction = useCallback((txn) => {
    setTransactions(prev => [{ ...txn, id: Date.now(), time: new Date() }, ...prev]);
  }, []);

  const dismissNotification = useCallback(() => setNotifications(0), []);

  return {
    syncOnline, setSyncOnline,
    transactions, addTransaction,
    selectedCustomer, setSelectedCustomer,
    notifications, dismissNotification,
  };
}

// ─── Root App ─────────────────────────────────────────────────────
export default function App() {
  const router   = useRouter(SCREENS.home);
  const state    = useAppState();
  const { toast, showToast } = useToast();

  const { current, anim, params, navigate, goBack } = router;
  const {
    syncOnline,
    transactions,
    addTransaction,
    selectedCustomer, setSelectedCustomer,
    notifications, dismissNotification,
  } = state;

  // ── Cross-screen handlers ──
  const handleNotification = useCallback(() => {
    dismissNotification();
    showToast("No new notifications");
  }, [dismissNotification, showToast]);

  const handleTransactionDone = useCallback((txn) => {
    addTransaction(txn);
    showToast(`₹${txn.amount} ${txn.type === "udhar" ? "credit" : "payment"} recorded ✓`);
    navigate(SCREENS.home);
  }, [addTransaction, showToast, navigate]);

  const handleScanSuccess = useCallback((customer) => {
    setSelectedCustomer(customer);
    navigate(SCREENS.keypad, { customer });
    showToast(`${customer.name} verified ✓`);
  }, [setSelectedCustomer, navigate, showToast]);

  const handleViewAll = useCallback(() => {
    navigate(SCREENS.customers);
  }, [navigate]);

  const handleCustomerPress = useCallback((customer) => {
    setSelectedCustomer(customer);
    navigate(SCREENS.customerProfile, { customer });
  }, [setSelectedCustomer, navigate]);

  // ── Screen renderer ──
  const renderScreen = () => {
    switch (current) {
      case SCREENS.home:
        return (
          <HomeDashboard
            syncOnline={syncOnline}
            onNavigate={navigate}
            onAddTransaction={() => navigate(SCREENS.keypad)}
            onViewAll={handleViewAll}
            onNotification={handleNotification}
          />
        );

      case SCREENS.customers:
        return (
          <CustomersList
            onCustomerPress={handleCustomerPress}
            onNavigate={navigate}
            onNotification={handleNotification}
            onBack={goBack}
          />
        );

      case SCREENS.customerProfile:
        return (
          <CustomerProfile
            customer={params?.customer || selectedCustomer}
            onBack={goBack}
            onNavigate={navigate}
            onCredit={(customer) => {
              setSelectedCustomer(customer);
              navigate(SCREENS.keypad, { customer });
            }}
            onPayment={(customer) => {
              setSelectedCustomer(customer);
              navigate(SCREENS.keypad, { customer });
            }}
          />
        );

      case SCREENS.reports:
        return (
          <ReportsDashboard
            onNavigate={navigate}
            onBack={goBack}
            onCustomerPress={handleCustomerPress}
          />
        );

      case SCREENS.scan:
        return (
          <ScanQR
            onScanSuccess={handleScanSuccess}
            onNavigate={navigate}
            onBack={goBack}
          />
        );

      case SCREENS.keypad:
        return (
          <TransactionKeypad
            syncOnline={syncOnline}
            preselectedCustomer={params?.customer || selectedCustomer || null}
            onTransactionDone={handleTransactionDone}
            onNavigate={navigate}
            onScanQR={() => navigate(SCREENS.scan)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Phone shell — optional wrapper for desktop preview */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#F0F2F8",
        boxShadow: "0 0 60px rgba(0,0,0,0.15)",
      }}>
        {/* Animated screen mount */}
        <div key={current} className={anim} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {renderScreen()}
        </div>

        {/* Global toast */}
        <Toast message={toast.message} visible={toast.visible} />
      </div>
    </>
  );
}