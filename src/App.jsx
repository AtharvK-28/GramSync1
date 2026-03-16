// App.jsx
// GramSync Merchant App — Root router
// Uses react-router-dom for URL-based navigation.
//
// Routes:
//   /login, /signup
//   /dashboard, /customers, /customers/profile, /reports, /scan, /keypad, /settings

import { useState, useCallback, useRef, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Authentication     from "./screens/Authentication";
import HomeDashboard      from "./screens/HomeDashboard";
import CustomersList      from "./screens/CustomersList";
import CustomerProfile    from "./screens/CustomerProfile";
import ReportsDashboard   from "./screens/ReportsDashboard";
import ScanQR             from "./screens/ScanQR";
import TransactionKeypad  from "./screens/TransactionKeypad";
import Settings           from "./screens/Settings";

const THEME_CSS = `
  body.dark-mode { background:#0D1226; }
  body.dark-mode #root { filter: invert(1) hue-rotate(180deg); }
  * { -webkit-text-size-adjust: 100%; }
  html, body, #root { min-height: 100dvh; }
`;
const ROUTES = {
  home: "\/dashboard",
  customers: "\/customers",
  customerProfile: "\/customers\/profile",
  reports: "\/reports",
  scan: "\/scan",
  keypad: "\/keypad",
  settings: "\/settings",
};

function routeFor(screenId) {
  return ROUTES[screenId] || ROUTES.home;
}

function RequireAuth({ isAuthed }) {
  const location = useLocation();
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

// Toast notification
function Toast({ message, visible }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 88,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#0D1226",
        color: "#fff",
        padding: "10px 20px",
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        zIndex: 999,
        transition: "opacity 0.25s ease, transform 0.25s ease",
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        fontFamily: "'Sora', sans-serif",
      }}
    >
      {message}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState({ message: "", visible: false });
  const timerRef = useRef(null);

  const showToast = useCallback((message) => {
    clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      2600
    );
  }, []);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return { toast, showToast };
}

// Central store — lightweight alternative to Redux/Zustand for this app.
function useAppState() {
  const [syncOnline, setSyncOnline] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [notifications, setNotifications] = useState(1);

  const addTransaction = useCallback((txn) => {
    setTransactions((prev) => [
      { ...txn, id: Date.now(), time: new Date() },
      ...prev,
    ]);
  }, []);

  const dismissNotification = useCallback(() => setNotifications(0), []);

  return {
    syncOnline,
    setSyncOnline,
    transactions,
    addTransaction,
    selectedCustomer,
    setSelectedCustomer,
    notifications,
    dismissNotification,
  };
}

function CustomerProfileRoute({
  selectedCustomer,
  setSelectedCustomer,
  onNavigate,
  onBack,
}) {
  const location = useLocation();
  const customer = location.state?.customer || selectedCustomer;

  if (!customer) {
    return <Navigate to={ROUTES.customers} replace />;
  }

  return (
    <CustomerProfile
      customer={customer}
      onBack={onBack}
      onNavigate={onNavigate}
      onCredit={(c) => {
        setSelectedCustomer(c);
        onNavigate("keypad", { customer: c });
      }}
      onPayment={(c) => {
        setSelectedCustomer(c);
        onNavigate("keypad", { customer: c });
      }}
    />
  );
}

function TransactionKeypadRoute({
  syncOnline,
  selectedCustomer,
  onTransactionDone,
  onNavigate,
}) {
  const location = useLocation();
  const customer = location.state?.customer || selectedCustomer || null;

  return (
    <TransactionKeypad
      syncOnline={syncOnline}
      preselectedCustomer={customer}
      onTransactionDone={onTransactionDone}
      onNavigate={onNavigate}
      onScanQR={() => onNavigate("scan")}
    />
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast } = useToast();

  const AUTH_KEY = "gramsync_authed";
  const DARK_KEY = "gramsync_dark";
  const [isAuthed, setIsAuthed] = useState(() => {
    try {
      return localStorage.getItem(AUTH_KEY) === "true";
    } catch {
      return false;
    }
  });
  const state = useAppState();

  useEffect(() => {
    try {
      const isDark = localStorage.getItem(DARK_KEY) === "true";
      document.body.classList.toggle("dark-mode", isDark);
    } catch {
      // Ignore storage failures
    }
  }, []);

  const {
    syncOnline,
    addTransaction,
    selectedCustomer,
    setSelectedCustomer,
    dismissNotification,
  } = state;

  const navigateTo = useCallback(
    (screenId, options) => {
      const path = routeFor(screenId);
      navigate(path, options);
    },
    [navigate]
  );

  const handleNotification = useCallback(() => {
    dismissNotification();
    showToast("No new notifications");
  }, [dismissNotification, showToast]);

  const handleTransactionDone = useCallback(
    (txn) => {
      addTransaction(txn);
      showToast(
        `?${txn.amount} ${txn.type === "udhar" ? "credit" : "payment"} recorded ?`
      );
      navigate(ROUTES.home, { replace: true });
    },
    [addTransaction, showToast, navigate]
  );

  const handleScanSuccess = useCallback(
    (customer) => {
      setSelectedCustomer(customer);
      navigate(ROUTES.keypad, { state: { customer } });
      showToast(`${customer.name} verified ?`);
    },
    [setSelectedCustomer, navigate, showToast]
  );

  const handleRecentTxnPress = useCallback(
    (txn) => {
      const customer = {
        id: `TX-${txn.id}`,
        name: txn.name,
        initials: txn.initials,
        phone: "",
        since: "July 2023",
        status: "safe",
      };
      setSelectedCustomer(customer);
      navigate(ROUTES.customerProfile, { state: { customer } });
    },
    [navigate, setSelectedCustomer]
  );

  const handleAuthDone = useCallback(() => {
    setIsAuthed(true);
    try {
      localStorage.setItem(AUTH_KEY, "true");
    } catch {
      // Ignore storage failures (private mode, disabled storage)
    }
    const next = location.state?.from?.pathname || ROUTES.home;
    navigate(next, { replace: true });
  }, [location.state, navigate]);

  const handleLogout = useCallback(() => {
    setIsAuthed(false);
    try {
      localStorage.setItem(AUTH_KEY, "false");
    } catch {
      // Ignore storage failures (private mode, disabled storage)
    }
    setSelectedCustomer(null);
    navigate("/login", { replace: true });
  }, [navigate, setSelectedCustomer]);

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to={isAuthed ? ROUTES.home : "/login"} replace />
          }
        />

        <Route
          path="/login"
          element={
            isAuthed ? (
              <Navigate to={ROUTES.home} replace />
            ) : (
              <Authentication mode="login" onAuthDone={handleAuthDone} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthed ? (
              <Navigate to={ROUTES.home} replace />
            ) : (
              <Authentication mode="signup" onAuthDone={handleAuthDone} />
            )
          }
        />

        <Route element={<RequireAuth isAuthed={isAuthed} />}>
          <Route
            path={ROUTES.home}
            element={
              <HomeDashboard
                syncOnline={syncOnline}
                onNavigate={navigateTo}
                onAddTransaction={() => navigateTo("keypad")}
                onViewAll={() => navigateTo("customers")}
                onNotification={handleNotification}
                onProfile={() => navigateTo("settings")}
                onTxnPress={handleRecentTxnPress}
              />
            }
          />

          <Route
            path={ROUTES.customers}
            element={
              <CustomersList
                onCustomerPress={(customer) => {
                  setSelectedCustomer(customer);
                  navigate(ROUTES.customerProfile, { state: { customer } });
                }}
                onNavigate={navigateTo}                onNotification={handleNotification}
                onProfile={() => navigateTo("settings")}                onBack={() => navigate(-1)}
              />
            }
          />

          <Route
            path={ROUTES.customerProfile}
            element={
              <CustomerProfileRoute
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                onNavigate={(id, options) => navigate(routeFor(id), options)}
                onBack={() => navigate(-1)}
              />
            }
          />

          <Route
            path={ROUTES.reports}
            element={
              <ReportsDashboard
                onNavigate={navigateTo}
                onBack={() => navigate(-1)}
                onCustomerPress={(customer) => {
                  setSelectedCustomer(customer);
                  navigate(ROUTES.customerProfile, { state: { customer } });
                }}
              />
            }
          />

          <Route
            path={ROUTES.scan}
            element={
              <ScanQR
                onScanSuccess={handleScanSuccess}
                onNavigate={navigateTo}
                onBack={() => navigate(-1)}
              />
            }
          />

          <Route
            path={ROUTES.keypad}
            element={
              <TransactionKeypadRoute
                syncOnline={syncOnline}
                selectedCustomer={selectedCustomer}
                onTransactionDone={handleTransactionDone}
                onNavigate={(id, options) => navigate(routeFor(id), options)}
              />
            }
          />

          <Route
            path={ROUTES.settings}
            element={
              <Settings
                onNavigate={navigateTo}
                onBack={() => navigate(-1)}
                onLogout={handleLogout}
              />
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <style>{THEME_CSS}</style>
      <AppRoutes />
    </BrowserRouter>
  );
}




