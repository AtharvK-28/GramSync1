// ScanQR.jsx
// GramSync Merchant App — Scan Customer QR Screen
// Fonts: Sora + JetBrains Mono (loaded via global CSS injection)
// Deps: pure React, no external libraries

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Design tokens ────────────────────────────────────────────────
const t = {
  blue:       "#2347F5",
  blueMid:    "#3A5BFF",
  bluePale:   "#EEF1FF",
  green:      "#0BAF60",
  greenPale:  "#E6F9F0",
  orange:     "#F56A00",
  red:        "#E8304A",
  yellow:     "#F5A623",
  bg:         "#0a0f2e",
  bgCard:     "rgba(255,255,255,0.07)",
  bgCardHover:"rgba(255,255,255,0.11)",
  text:       "#FFFFFF",
  muted:      "rgba(255,255,255,0.55)",
  border:     "rgba(255,255,255,0.10)",
  navBg:      "#0f1535",
  navBorder:  "rgba(255,255,255,0.08)",
};

// ─── Recent scan history (sample) ────────────────────────────────
const SCAN_HISTORY = [
  { id: 1, name: "Suresh Kumar",  initials: "SK", time: "10:45 AM", type: "Udhar", amount: "₹450",   color: "#F56A00" },
  { id: 2, name: "Priya Devi",    initials: "PD", time: "09:12 AM", type: "Jama",  amount: "+₹1,200", color: "#0BAF60" },
  { id: 3, name: "Vikram Singh",  initials: "VS", time: "Yesterday",type: "Udhar", amount: "₹2,100", color: "#F56A00" },
];

// ─── Injected global styles ───────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  ::-webkit-scrollbar { display: none; }

  @keyframes scanLine {
    0%   { top: 12px; opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { top: calc(100% - 12px); opacity: 0; }
  }

  @keyframes cornerPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes ripple {
    0%   { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes successPop {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  .scan-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    background: none;
    border: none;
    color: rgba(255,255,255,0.55);
    font-family: 'Sora', sans-serif;
    font-size: 11px;
    font-weight: 500;
    transition: color 0.15s;
    padding: 4px 8px;
  }
  .scan-action-btn:hover { color: rgba(255,255,255,0.9); }
  .scan-action-btn.active-btn { color: #fff; }

  .scan-action-circle {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: rgba(255,255,255,0.10);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, transform 0.12s;
  }
  .scan-action-btn:active .scan-action-circle {
    transform: scale(0.92);
  }
  .scan-action-circle.active-circle {
    background: #2347F5;
    box-shadow: 0 4px 18px rgba(35,71,245,0.5);
  }

  .extra-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 18px 12px;
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'Sora', sans-serif;
    transition: background 0.15s;
    border-radius: 0;
  }
  .extra-btn:hover { background: rgba(255,255,255,0.05); }
  .extra-btn:active { background: rgba(255,255,255,0.09); }

  .manual-input {
    background: rgba(255,255,255,0.07);
    border: 1.5px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    padding: 14px 16px;
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    color: #fff;
    width: 100%;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    letter-spacing: 0.08em;
  }
  .manual-input::placeholder { color: rgba(255,255,255,0.35); letter-spacing: 0; }
  .manual-input:focus {
    border-color: #2347F5;
    box-shadow: 0 0 0 3px rgba(35,71,245,0.25);
  }

  .history-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.12s;
    border-radius: 12px;
  }
  .history-row:hover { background: rgba(255,255,255,0.05); }

  .nav-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0 12px;
    gap: 4px;
    cursor: pointer;
    border: none;
    background: none;
    font-family: 'Sora', sans-serif;
    font-size: 10px;
    font-weight: 500;
    transition: color 0.15s;
  }
`;

// ─── Scanning Frame ───────────────────────────────────────────────
function ScanFrame({ scanning }) {
  return (
    <div style={{
      width: 264, height: 248,
      position: "relative",
      margin: "0 auto",
    }}>
      {/* Corner brackets */}
      {[
        { top: 0,    left: 0,    borderWidth: "3px 0 0 3px",   borderRadius: "5px 0 0 0" },
        { top: 0,    right: 0,   borderWidth: "3px 3px 0 0",   borderRadius: "0 5px 0 0" },
        { bottom: 0, left: 0,    borderWidth: "0 0 3px 3px",   borderRadius: "0 0 0 5px" },
        { bottom: 0, right: 0,   borderWidth: "0 3px 3px 0",   borderRadius: "0 0 5px 0" },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 38, height: 38,
          borderStyle: "solid",
          borderColor: t.blue,
          animation: scanning ? `cornerPulse 1.8s ease-in-out infinite ${i * 0.15}s` : "none",
          ...pos,
        }} />
      ))}

      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.06,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)
        `,
        backgroundSize: "33px 33px",
      }} />

      {/* Scan line */}
      {scanning && (
        <div style={{
          position: "absolute",
          left: 10, right: 10, height: 2,
          background: `linear-gradient(90deg, transparent, ${t.blue}, ${t.blueMid}, ${t.blue}, transparent)`,
          animation: "scanLine 2s linear infinite",
          borderRadius: 99,
          boxShadow: `0 0 12px ${t.blue}`,
          filter: "blur(0.5px)",
        }} />
      )}

      {/* Ripple rings when scanning */}
      {scanning && (
        <>
          <div style={{
            position: "absolute", inset: "30%", borderRadius: "50%",
            border: `1.5px solid ${t.blue}`,
            animation: "ripple 2s ease-out infinite",
            opacity: 0,
          }} />
          <div style={{
            position: "absolute", inset: "30%", borderRadius: "50%",
            border: `1.5px solid ${t.blue}`,
            animation: "ripple 2s ease-out infinite 0.7s",
            opacity: 0,
          }} />
        </>
      )}

      {/* Center dot */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 6, height: 6, borderRadius: "50%",
        background: t.blue, opacity: 0.6,
        boxShadow: `0 0 8px ${t.blue}`,
      }} />
    </div>
  );
}

// ─── Success Overlay ──────────────────────────────────────────────
function SuccessOverlay({ customer, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 200,
      background: "rgba(10,15,46,0.92)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24,
      animation: "fadeSlideUp 0.25s ease",
    }}>
      {/* Check circle */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: t.greenPale,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18,
        animation: "successPop 0.35s ease",
      }}>
        <svg width="34" height="34" fill="none" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke={t.green} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Customer Found</div>
      <div style={{ fontSize: 13, color: t.muted, marginBottom: 24 }}>Scan successful</div>

      {/* Customer card */}
      <div style={{
        background: "rgba(255,255,255,0.08)", borderRadius: 16,
        padding: "18px 20px", width: "100%", marginBottom: 24,
        border: "1px solid rgba(255,255,255,0.12)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: t.bluePale, color: t.blue,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 16, flexShrink: 0,
          }}>
            {customer.initials}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{customer.name}</div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>ID: {customer.id}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span style={{
              background: t.greenPale, color: t.green,
              borderRadius: 6, fontSize: 10, fontWeight: 700,
              padding: "3px 8px", letterSpacing: "0.04em",
            }}>VERIFIED</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Trust Score</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: t.green, fontFamily: "'JetBrains Mono', monospace" }}>{customer.score}</div>
            <div style={{ fontSize: 10, color: t.green, marginTop: 2 }}>↑ High Trust</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Balance</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>{customer.balance}</div>
            <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>Outstanding</div>
          </div>
        </div>
      </div>

      <button onClick={onConfirm} style={{
        width: "100%", padding: "16px", borderRadius: 14,
        background: t.blue, color: "#fff", border: "none",
        fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15,
        cursor: "pointer", marginBottom: 12,
        boxShadow: `0 4px 16px rgba(35,71,245,0.4)`,
        transition: "transform 0.1s",
      }}
        onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
      >
        Confirm & Proceed
      </button>
      <button onClick={onCancel} style={{
        width: "100%", padding: "14px", borderRadius: 14,
        background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)",
        border: "1px solid rgba(255,255,255,0.12)",
        fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 14,
        cursor: "pointer",
      }}>
        Cancel
      </button>
    </div>
  );
}

// ─── Manual Entry Panel ───────────────────────────────────────────
function ManualPanel({ onSubmit, onClose }) {
  const [val, setVal] = useState("");
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 150,
      background: "#111b44",
      borderRadius: "20px 20px 0 0",
      padding: "24px 20px 32px",
      border: "1px solid rgba(255,255,255,0.1)",
      animation: "fadeSlideUp 0.25s ease",
      boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
    }}>
      {/* Handle */}
      <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Enter Customer ID</div>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
          width: 30, height: 30, color: t.muted, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700,
        }}>×</button>
      </div>

      <input
        className="manual-input"
        placeholder="e.g. GS-9982"
        value={val}
        onChange={e => setVal(e.target.value.toUpperCase())}
        autoFocus
        maxLength={12}
      />

      <div style={{ fontSize: 11, color: t.muted, marginTop: 8, marginBottom: 20 }}>
        Enter the 6–10 digit GramSync Customer ID
      </div>

      <button
        onClick={() => val.trim() && onSubmit(val.trim())}
        disabled={!val.trim()}
        style={{
          width: "100%", padding: "15px", borderRadius: 14,
          background: val.trim() ? t.blue : "rgba(255,255,255,0.1)",
          color: val.trim() ? "#fff" : t.muted,
          border: "none", fontFamily: "'Sora', sans-serif",
          fontWeight: 700, fontSize: 15, cursor: val.trim() ? "pointer" : "default",
          transition: "background 0.2s, color 0.2s",
        }}
      >
        Look Up Customer
      </button>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────
function HistoryPanel({ history, onSelect, onClose }) {
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 150,
      background: "#111b44",
      borderRadius: "20px 20px 0 0",
      padding: "24px 0 32px",
      border: "1px solid rgba(255,255,255,0.1)",
      animation: "fadeSlideUp 0.25s ease",
      boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
      maxHeight: "55vh", overflowY: "auto",
    }}>
      <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 16px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Recent Scans</div>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
          width: 30, height: 30, color: t.muted, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700,
        }}>×</button>
      </div>

      {history.map((item) => (
        <div key={item.id} className="history-row" onClick={() => onSelect(item)}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {item.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{item.name}</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{item.type} · {item.time}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>
              {item.amount}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home",   label: "HOME"    },
  { id: "scan",   label: "SCAN"    },
  { id: "wallet", label: "WALLET"  },
  { id: "profile",label: "PROFILE" },
];

function NavIcon({ id }) {
  const s = { stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (id) {
    case "home": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M3 12L12 3l9 9" {...s}/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" {...s}/>
      </svg>
    );
    case "scan": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" {...s}/>
        <rect x="14" y="3" width="7" height="7" rx="1" {...s}/>
        <rect x="3" y="14" width="7" height="7" rx="1" {...s}/>
        <rect x="14" y="14" width="7" height="7" rx="1" {...s}/>
      </svg>
    );
    case "wallet": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" {...s}/>
        <path d="M16 12a1 1 0 110 2 1 1 0 010-2z" fill="currentColor"/>
        <path d="M2 10h20" {...s}/>
      </svg>
    );
    case "profile": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" {...s}/>
        <path d="M5 20v-1a7 7 0 0114 0v1" {...s}/>
      </svg>
    );
    default: return null;
  }
}

function BottomNav({ active = "scan", onNavigate }) {
  return (
    <nav style={{
      background: t.navBg,
      borderTop: `1px solid ${t.navBorder}`,
      display: "flex", zIndex: 100,
    }}>
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className="nav-btn"
          onClick={() => onNavigate?.(item.id)}
          style={{ color: active === item.id ? "#fff" : "rgba(255,255,255,0.35)" }}
        >
          <NavIcon id={item.id} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Torch Button ─────────────────────────────────────────────────
function TorchButton({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        background: on ? "rgba(245,166,35,0.25)" : t.bgCard,
        border: `1px solid ${on ? "rgba(245,166,35,0.5)" : t.border}`,
        borderRadius: 14, padding: "16px 0",
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", gap: 8, cursor: "pointer",
        transition: "background 0.2s, border-color 0.2s",
        fontFamily: "'Sora', sans-serif",
      }}
    >
      <div style={{
        width: 42, height: 42, background: on ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.08)",
        borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s",
      }}>
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
          <path d="M17 10h2a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2h2m5-4v8m0-8l-3 3m3-3l3 3"
            stroke={on ? t.yellow : "rgba(255,255,255,0.7)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: on ? t.yellow : "rgba(255,255,255,0.7)" }}>
        {on ? "Torch On" : "Flashlight"}
      </span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────

/**
 * ScanQR
 *
 * Props:
 *  - onScanSuccess     {(customer) => void}   — called when QR scanned / ID confirmed
 *  - onNavigate        {(screenId) => void}
 *  - onBack            {() => void}
 *  - scanHistory       {Array}                — recent scan items
 *  - simulateScan      {boolean}              — if true, auto-triggers a mock scan after 2s (demo/dev mode)
 */
export default function ScanQR({
  onScanSuccess = () => {},
  onNavigate    = () => {},
  onBack        = () => {},
  scanHistory   = SCAN_HISTORY,
  simulateScan  = false,
}) {
  const [scanning,     setScanning]     = useState(true);
  const [torchOn,      setTorchOn]      = useState(false);
  const [panel,        setPanel]        = useState(null); // null | "manual" | "history"
  const [scanResult,   setScanResult]   = useState(null);
  const [shown,        setShown]        = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(id);
  }, []);

  // Demo: simulate a successful scan after 2.8s if prop enabled
  useEffect(() => {
    if (!simulateScan) return;
    timerRef.current = setTimeout(() => {
      handleScanResult({
        initials: "AS",
        name:     "Amit Sharma",
        id:       "#GS-9982",
        score:    "850/1000",
        balance:  "₹4,250",
      });
    }, 2800);
    return () => clearTimeout(timerRef.current);
  }, [simulateScan]);

  const handleScanResult = useCallback((customer) => {
    setScanning(false);
    setScanResult(customer);
    setPanel(null);
  }, []);

  const handleManualSubmit = useCallback((id) => {
    // In production, look up customer by ID via API
    handleScanResult({
      initials: "MK",
      name:     "Mahesh Khatri",
      id:       `#${id}`,
      score:    "620/1000",
      balance:  "₹1,800",
    });
  }, [handleScanResult]);

  const handleConfirm = useCallback(() => {
    onScanSuccess(scanResult);
    // Reset for next scan
    setScanResult(null);
    setScanning(true);
  }, [scanResult, onScanSuccess]);

  const handleCancel = useCallback(() => {
    setScanResult(null);
    setScanning(true);
  }, []);

  const closePanel = useCallback(() => setPanel(null), []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{
        width: "100%", maxWidth: 420, minHeight: "100vh",
        background: t.bg,
        display: "flex", flexDirection: "column",
        margin: "0 auto", position: "relative",
        fontFamily: "'Sora', sans-serif",
        overflow: "hidden",
      }}>

        {/* ── Topbar ── */}
        <div style={{
          padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          opacity: shown ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}>
          <button onClick={onBack} style={{
            background: "rgba(255,255,255,0.1)", border: "none",
            color: "#fff", width: 38, height: 38, borderRadius: 12,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.16)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.10)"}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Scan Customer QR</span>

          <button style={{
            background: "rgba(255,255,255,0.1)", border: "none",
            color: "#fff", width: 38, height: 38, borderRadius: 12,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="2" fill="#fff" opacity="0.8"/>
              <circle cx="19" cy="12" r="2" fill="#fff" opacity="0.8"/>
              <circle cx="5"  cy="12" r="2" fill="#fff" opacity="0.8"/>
            </svg>
          </button>
        </div>

        {/* ── Camera area ── */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "10px 20px 20px",
          opacity: shown ? 1 : 0,
          transition: "opacity 0.4s ease 0.1s",
        }}>
          {/* Status pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 99, padding: "5px 14px",
            marginBottom: 28,
            border: `1px solid ${t.border}`,
          }}>
            {scanning ? (
              <>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: t.blue,
                  boxShadow: `0 0 6px ${t.blue}`,
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                  Scanning…
                </span>
              </>
            ) : (
              <>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.green }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Ready</span>
              </>
            )}
          </div>

          <ScanFrame scanning={scanning} />

          <div style={{
            marginTop: 22, marginBottom: 30,
            fontSize: 13, color: t.muted,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
              <path d="M12 8v4m0 4h.01" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Align QR code within the frame
          </div>

          {/* Gallery / Scan / History */}
          <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
            <button className="scan-action-btn" onClick={() => setPanel("history")}>
              <div className="scan-action-circle">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8"/>
                  <path d="M3 9h18M9 21V9" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8"/>
                </svg>
              </div>
              Gallery
            </button>

            <button className="scan-action-btn active-btn" onClick={() => { setScanning(true); setScanResult(null); }}>
              <div className="scan-action-circle active-circle">
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="#fff" strokeWidth="1.8"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="#fff" strokeWidth="1.8"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="#fff" strokeWidth="1.8"/>
                  <rect x="14" y="14" width="3" height="3" fill="#fff" rx="0.5"/>
                  <rect x="18" y="14" width="3" height="3" fill="#fff" rx="0.5"/>
                  <rect x="14" y="18" width="3" height="3" fill="#fff" rx="0.5"/>
                  <rect x="18" y="18" width="3" height="3" fill="#fff" rx="0.5"/>
                </svg>
              </div>
              Scan
            </button>

            <button className="scan-action-btn" onClick={() => setPanel("history")}>
              <div className="scan-action-circle">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              History
            </button>
          </div>
        </div>

        {/* ── Extra Actions ── */}
        <div style={{
          display: "flex", margin: "0 16px 16px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: 16,
          border: `1px solid ${t.border}`,
          overflow: "hidden",
          opacity: shown ? 1 : 0,
          transform: shown ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.35s ease 0.2s, transform 0.35s ease 0.2s",
        }}>
          <TorchButton on={torchOn} onToggle={() => setTorchOn(v => !v)} />
          <div style={{ width: 1, background: t.border }} />
          <button
            className="extra-btn"
            onClick={() => setPanel("manual")}
            style={{ flex: 1, borderRadius: 0 }}
          >
            <div style={{
              width: 42, height: 42, background: "rgba(255,255,255,0.08)",
              borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2"
                  stroke="rgba(255,255,255,0.7)" strokeWidth="1.8"/>
                <path d="M8 10h8M8 14h5"
                  stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
              Enter ID Manually
            </span>
          </button>
        </div>

        <BottomNav active="scan" onNavigate={onNavigate} />

        {/* ── Overlays ── */}
        {scanResult && (
          <SuccessOverlay
            customer={scanResult}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}

        {panel === "manual" && (
          <ManualPanel onSubmit={handleManualSubmit} onClose={closePanel} />
        )}

        {panel === "history" && (
          <HistoryPanel history={scanHistory} onSelect={item => {
            setPanel(null);
            handleScanResult({
              initials: item.initials, name: item.name,
              id: `#GS-${1000 + item.id}`, score: "780/1000", balance: item.amount,
            });
          }} onClose={closePanel} />
        )}

        {/* Dim backdrop for panels */}
        {panel && (
          <div
            onClick={closePanel}
            style={{
              position: "absolute", inset: 0, zIndex: 140,
              background: "rgba(0,0,0,0.5)",
            }}
          />
        )}
      </div>
    </>
  );
}