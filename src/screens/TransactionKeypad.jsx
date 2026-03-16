// TransactionKeypad.jsx
// GramSync Merchant App â€” Transaction Keypad Screen
// Fonts: Sora + JetBrains Mono (loaded via global CSS injection)
// Deps: pure React, no external libraries

import { useState, useEffect, useRef, useCallback } from "react";

// â”€â”€â”€ Design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const t = {
  blue:        "#2347F5",
  blueMid:     "#3A5BFF",
  bluePale:    "#EEF1FF",
  green:       "#0BAF60",
  greenPale:   "#E6F9F0",
  greenDark:   "#098F4E",
  orange:      "#F56A00",
  orangePale:  "#FFF0E5",
  orangeDark:  "#C45500",
  red:         "#E8304A",
  yellow:      "#F5A623",
  bg:          "#F0F2F8",
  card:        "#FFFFFF",
  text:        "#0D1226",
  muted:       "#7A85A3",
  border:      "#E2E6F3",
  keyBg:       "#F4F6FB",
  keyActive:   "#E2E6F3",
};

// â”€â”€â”€ Injected global styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: #F0F2F8; font-family: 'Sora', sans-serif; }
  ::-webkit-scrollbar { display: none; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes amountPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.06); }
    100% { transform: scale(1); }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }
  @keyframes successBounce {
    0%   { transform: scale(0.4) rotate(-10deg); opacity: 0; }
    60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes confettiDrop {
    0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 4px 16px rgba(35,71,245,0.3); }
    50%       { box-shadow: 0 4px 28px rgba(35,71,245,0.55); }
  }

  .num-key {
    background: #F4F6FB;
    border: none;
    border-radius: 14px;
    height: 64px;
    font-family: 'Sora', sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #0D1226;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 2px;
    transition: background 0.1s, transform 0.1s;
    user-select: none;
    position: relative;
    overflow: hidden;
  }
  .num-key:hover  { background: #EAEEF8; }
  .num-key:active { background: #E2E6F3; transform: scale(0.94); }
  .num-key.del    { background: #fff; border: 1.5px solid #E2E6F3; }
  .num-key.del:active { background: #F4F6FB; }

  .action-btn {
    flex: 1;
    height: 62px;
    border: none;
    border-radius: 16px;
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 14px;
    letter-spacing: 0.04em;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    transition: transform 0.12s, box-shadow 0.12s, filter 0.12s;
    position: relative;
    overflow: hidden;
    user-select: none;
  }
  .action-btn:hover  { filter: brightness(1.06); }
  .action-btn:active { transform: scale(0.95); }
  .action-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.15);
    opacity: 0;
    transition: opacity 0.15s;
  }
  .action-btn:active::after { opacity: 1; }

  .remarks-input {
    background: none;
    border: none;
    outline: none;
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    color: #7A85A3;
    width: 100%;
    cursor: text;
  }
  .remarks-input::placeholder { color: #7A85A3; }

  .customer-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #EEF1FF;
    border-radius: 99px;
    padding: 6px 12px 6px 6px;
    cursor: pointer;
    transition: background 0.15s;
    border: 1.5px solid transparent;
  }
  .customer-chip:hover { background: #dde3ff; }
  .customer-chip-empty {
    width: 100%;
    max-width: 340px;
    justify-content: space-between;
    background: #fff;
    border: 2px dashed #CDD5F6;
    border-radius: 16px;
    padding: 12px 14px;
    box-shadow: 0 6px 20px rgba(35,71,245,0.08);
  }
  .customer-chip-empty:hover { background: #F7F9FF; }
  .customer-chip-title {
    font-size: 14px;
    font-weight: 800;
    color: #2347F5;
  }
  .customer-chip-sub {
    font-size: 11px;
    color: #7A85A3;
    margin-top: 2px;
    letter-spacing: 0.02em;
  }

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

  .confirm-btn {
    width: 100%;
    padding: 17px;
    border-radius: 14px;
    border: none;
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.12s, filter 0.12s;
  }
  .confirm-btn:hover  { filter: brightness(1.06); }
  .confirm-btn:active { transform: scale(0.97); }
`;

// â”€â”€â”€ Confetti particles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CONFETTI_COLORS = ["#2347F5", "#0BAF60", "#F56A00", "#F5A623", "#E8304A", "#fff"];
function Confetti() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${8 + Math.random() * 84}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${Math.random() * 0.4}s`,
    size: 6 + Math.random() * 8,
    duration: `${0.8 + Math.random() * 0.6}s`,
  }));
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          top: -10,
          left: p.left,
          width: p.size,
          height: p.size,
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          background: p.color,
          animation: `confettiDrop ${p.duration} ease-in ${p.delay} forwards`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

// â”€â”€â”€ Success Sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SuccessSheet({ type, amount, customer, remarks, onDone, onNewTransaction }) {
  const isUdhar = type === "udhar";
  const color   = isUdhar ? t.orange : t.green;
  const bgColor = isUdhar ? t.orangePale : t.greenPale;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 200,
      background: "rgba(13,18,38,0.65)",
      display: "flex", alignItems: "flex-end",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "24px 24px 0 0",
        width: "100%",
        padding: "28px 24px 40px",
        position: "relative",
        overflow: "hidden",
        animation: "fadeSlideUp 0.28s cubic-bezier(.22,1,.36,1)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
      }}>
        <Confetti />

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: bgColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
          animation: "successBounce 0.4s cubic-bezier(.22,1,.36,1)",
        }}>
          {isUdhar ? (
            <svg width="34" height="34" fill="none" viewBox="0 0 24 24">
              <path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="34" height="34" fill="none" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            {isUdhar ? "Credit Given" : "Payment Received"}
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, color: t.text, fontFamily: "'JetBrains Mono', monospace" }}>
            â‚¹{amount}
          </div>
          {customer && (
            <div style={{ fontSize: 14, color: t.muted, marginTop: 6 }}>
              {isUdhar ? "to" : "from"} <strong style={{ color: t.text }}>{customer.name}</strong>
            </div>
          )}
          {remarks && (
            <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>"{remarks}"</div>
          )}
        </div>

        {/* Details card */}
        <div style={{
          background: t.bg, borderRadius: 14, padding: "14px 16px",
          marginBottom: 20, display: "flex", flexDirection: "column", gap: 10,
        }}>
          {[
            { label: "Transaction ID", value: `#TXN-${Math.floor(Math.random() * 90000) + 10000}` },
            { label: "Time",           value: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
            { label: "Sync Status",    value: "âœ“ Synced to Cloud", valueColor: t.green },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: t.muted }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: row.valueColor || t.text, fontFamily: i === 0 ? "'JetBrains Mono', monospace" : "'Sora', sans-serif" }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <button className="confirm-btn" onClick={onDone}
          style={{ background: color, color: "#fff", marginBottom: 12,
            boxShadow: `0 4px 20px ${isUdhar ? "rgba(245,106,0,0.35)" : "rgba(11,175,96,0.35)"}` }}>
          Done
        </button>
        <button className="confirm-btn" onClick={onNewTransaction}
          style={{ background: t.bluePale, color: t.blue, fontSize: 14 }}>
          New Transaction
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Customer Selector Sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SAMPLE_CUSTOMERS = [
  { id: 1, name: "Suresh Kumar", phone: "+91 98765 43210", initials: "SK", score: 842, status: "safe"      },
  { id: 2, name: "Priya Devi",   phone: "+91 98221 55667", initials: "PD", score: 512, status: "caution"   },
  { id: 3, name: "Anita Verma",  phone: "+91 94455 66778", initials: "AV", score: 710, status: "safe"      },
  { id: 4, name: "Rohit Nair",   phone: "+91 95566 77889", initials: "RN", score: 245, status: "high-risk" },
  { id: 5, name: "Kavita Singh", phone: "+91 96677 88990", initials: "KS", score: 790, status: "safe"      },
];

const STATUS_COLORS = { safe: t.green, caution: t.yellow, "high-risk": t.red, new: t.blue };

function CustomerSheet({ onSelect, onScanQR, onClose }) {
  const [query, setQuery] = useState("");
  const filtered = SAMPLE_CUSTOMERS.filter(c =>
    !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query)
  );

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 180,
      background: "rgba(13,18,38,0.55)",
      display: "flex", alignItems: "flex-end",
      animation: "fadeIn 0.18s ease",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: "22px 22px 0 0",
        width: "100%", maxHeight: "72vh",
        display: "flex", flexDirection: "column",
        animation: "fadeSlideUp 0.26s cubic-bezier(.22,1,.36,1)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
      }} onClick={e => e.stopPropagation()}>
        {/* Handle + header */}
        <div style={{ padding: "18px 20px 12px" }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: t.border, margin: "0 auto 16px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Select Customer</div>
            <button onClick={onClose} style={{
              background: t.bg, border: "none", borderRadius: "50%",
              width: 30, height: 30, cursor: "pointer", color: t.muted,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700,
            }}>Ã—</button>
          </div>

          {/* Scan QR option */}
          <button onClick={onScanQR} style={{
            width: "100%", padding: "13px 16px", borderRadius: 12,
            background: t.blue, color: "#fff", border: "none",
            fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, marginBottom: 12,
            boxShadow: "0 3px 14px rgba(35,71,245,0.3)",
            animation: "pulseGlow 2s ease-in-out infinite",
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="#fff" strokeWidth="1.8"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="#fff" strokeWidth="1.8"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="#fff" strokeWidth="1.8"/>
              <rect x="14" y="14" width="3" height="3" fill="#fff" rx="0.5"/>
              <rect x="18" y="14" width="3" height="3" fill="#fff" rx="0.5"/>
              <rect x="14" y="18" width="3" height="3" fill="#fff" rx="0.5"/>
              <rect x="18" y="18" width="3" height="3" fill="#fff" rx="0.5"/>
            </svg>
            Scan QR Identity Card
          </button>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke={t.muted} strokeWidth="1.8"/>
              <path d="M21 21l-4.35-4.35" stroke={t.muted} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or phoneâ€¦"
              style={{
                width: "100%", padding: "11px 14px 11px 36px",
                border: `1.5px solid ${t.border}`, borderRadius: 10,
                fontFamily: "'Sora', sans-serif", fontSize: 13, color: t.text,
                background: t.bg, outline: "none",
              }}
            />
          </div>
        </div>

        {/* Customer list */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 12px 20px" }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => onSelect(c)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 8px", borderRadius: 12, cursor: "pointer",
              transition: "background 0.12s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = t.bg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: t.bluePale, color: t.blue,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}>{c.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{c.name}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{c.phone}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[c.status] || t.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {c.status.replace("-", " ")}
                </div>
                <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
                  {c.score}/900
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Topbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Topbar({ syncOnline, onScanQR }) {
  return (
    <div style={{
      background: "#fff",
      padding: "14px 18px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: `1px solid ${t.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Logo mark */}
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: t.blue, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 20l5-7 4 5 3-4 5 6H4z" fill="#fff" opacity="0.9"/>
            <circle cx="19" cy="7" r="3" fill="#fff"/>
          </svg>
        </div>
        <span style={{ fontSize: 17, fontWeight: 800, color: t.text }}>GramSync</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Sync pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: syncOnline ? t.greenPale : "#FFF8E5",
          borderRadius: 99, padding: "5px 12px",
          fontSize: 11, fontWeight: 700,
          color: syncOnline ? t.green : t.yellow,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: syncOnline ? t.green : t.yellow }} />
          SYNC: {syncOnline ? "ONLINE" : "OFFLINE"}
        </div>

        {/* QR scan shortcut */}
        <button onClick={onScanQR} style={{
          width: 38, height: 38, background: t.bluePale, border: "none",
          borderRadius: 10, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#dde3ff"}
          onMouseLeave={e => e.currentTarget.style.background = t.bluePale}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke={t.blue} strokeWidth="1.8"/>
            <rect x="14" y="3" width="7" height="7" rx="1" stroke={t.blue} strokeWidth="1.8"/>
            <rect x="3" y="14" width="7" height="7" rx="1" stroke={t.blue} strokeWidth="1.8"/>
            <rect x="14" y="14" width="3" height="3" fill={t.blue} rx="0.5"/>
            <rect x="18" y="14" width="3" height="3" fill={t.blue} rx="0.5"/>
            <rect x="14" y="18" width="3" height="3" fill={t.blue} rx="0.5"/>
            <rect x="18" y="18" width="3" height="3" fill={t.blue} rx="0.5"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Amount Display â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AmountDisplay({ value, animKey, shake }) {
  const formatted = (() => {
    if (!value || value === "0") return "0";
    const parts = value.split(".");
    parts[0] = parseInt(parts[0], 10).toLocaleString("en-IN");
    return parts.join(".");
  })();

  const hasDecimal = value.includes(".");
  const decimals   = hasDecimal ? value.split(".")[1] : "";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      flex: 1, padding: "10px 20px 0",
      gap: 8,
    }}>
      <div style={{ fontSize: 12, color: t.muted, fontWeight: 500 }}>Enter Amount</div>

      <div style={{
        display: "flex", alignItems: "baseline", gap: 4,
        animation: shake
          ? `shake 0.35s ease`
          : animKey > 0
          ? `amountPop 0.2s ease`
          : "none",
        key: animKey,
      }}>
        <span style={{ fontSize: 30, fontWeight: 400, color: t.muted, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>â‚¹</span>
        <span style={{
          fontSize: formatted.length > 7 ? 40 : 56,
          fontWeight: 800, color: t.blue,
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 1, letterSpacing: "-0.02em",
          transition: "font-size 0.15s ease",
        }}>
          {formatted.split(".")[0]}
        </span>
        {hasDecimal && (
          <span style={{ fontSize: 28, fontWeight: 600, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
            .{decimals}
          </span>
        )}
      </div>

      {/* Remarks */}
      <RemarksRow />
    </div>
  );
}

function RemarksRow() {
  const [editing, setEditing] = useState(false);
  const [remarks, setRemarks] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: editing ? "#fff" : "transparent",
      border: `1.5px solid ${editing ? t.border : "transparent"}`,
      borderRadius: 10, padding: editing ? "7px 12px" : "4px 8px",
      cursor: "text", transition: "all 0.15s",
      maxWidth: 260,
    }} onClick={() => setEditing(true)}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
          stroke={remarks ? t.blue : t.muted} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke={remarks ? t.blue : t.muted} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      {editing ? (
        <input
          ref={inputRef}
          className="remarks-input"
          placeholder="Add remarksâ€¦"
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          onBlur={() => { if (!remarks) setEditing(false); }}
          maxLength={60}
        />
      ) : (
        <span style={{ fontSize: 13, color: t.muted, fontStyle: remarks ? "normal" : "italic" }}>
          {remarks || "Add Remarks (Optional)"}
        </span>
      )}
    </div>
  );
}

// â”€â”€â”€ Customer Chip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CustomerChip({ customer, onClear, onOpen }) {
  if (!customer) {
    return (
      <button onClick={onOpen} className="customer-chip customer-chip-empty">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: t.bluePale, color: t.blue,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="9" cy="7" r="4" stroke={t.blue} strokeWidth="1.8"/>
              <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={t.blue} strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M19 8v6M16 11h6" stroke={t.blue} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ textAlign: "left" }}>
            <div className="customer-chip-title">Select Customer</div>
            <div className="customer-chip-sub">Required before saving transaction</div>
          </div>
        </div>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" stroke={t.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    );
  }

  return (
    <div className="customer-chip" onClick={onOpen}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%", background: t.blue,
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 10, flexShrink: 0,
      }}>{customer.initials}</div>
      <span style={{ fontSize: 13, fontWeight: 700, color: t.blue }}>{customer.name}</span>
      <button onClick={e => { e.stopPropagation(); onClear(); }} style={{
        background: "none", border: "none", cursor: "pointer",
        color: t.muted, fontSize: 16, fontWeight: 700,
        display: "flex", alignItems: "center", lineHeight: 1, padding: 0,
      }}>Ã—</button>
    </div>
  );
}

// â”€â”€â”€ Numpad â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Numpad({ onPress, onDelete }) {
  const keys = ["1","2","3","4","5","6","7","8","9",".","0","del"];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
      gap: 10, marginBottom: 14,
    }}>
      {keys.map(k => (
        <button
          key={k}
          className={`num-key${k === "del" ? " del" : ""}`}
          onClick={() => k === "del" ? onDelete() : onPress(k)}
        >
          {k === "del" ? (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={t.muted} strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M18 9l-6 6M12 9l6 6" stroke={t.muted} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : k}
        </button>
      ))}
    </div>
  );
}

// â”€â”€â”€ Action Buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ActionButtons({ onUdhar, onJama, disabled }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <button className="action-btn" onClick={onUdhar} disabled={disabled}
        style={{
          background: disabled ? "#F4F6FB" : `linear-gradient(135deg, ${t.orange}, ${t.orangeDark})`,
          color: disabled ? t.muted : "#fff",
          boxShadow: disabled ? "none" : "0 4px 18px rgba(245,106,0,0.35)",
        }}>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.06em" }}>UDHAR</span>
        <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 500, letterSpacing: "0.06em" }}>GIVE CREDIT</span>
      </button>
      <button className="action-btn" onClick={onJama} disabled={disabled}
        style={{
          background: disabled ? "#F4F6FB" : `linear-gradient(135deg, ${t.green}, ${t.greenDark})`,
          color: disabled ? t.muted : "#fff",
          boxShadow: disabled ? "none" : "0 4px 18px rgba(11,175,96,0.35)",
        }}>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.06em" }}>JAMA</span>
        <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 500, letterSpacing: "0.06em" }}>RECEIVE PAYMENT</span>
      </button>
    </div>
  );
}

// â”€â”€â”€ Bottom Nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NAV_ITEMS = [
  { id: "keypad",   label: "KEYPAD"   },
  { id: "passbook", label: "PASSBOOK" },
  { id: "parties",  label: "PARTIES"  },
  { id: "reports",  label: "REPORTS"  },
];
function NavIcon({ id }) {
  const s = { stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (id) {
    case "keypad": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" {...s}/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" {...s}/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" {...s}/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" {...s}/>
      </svg>
    );
    case "passbook": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h10" {...s}/>
      </svg>
    );
    case "parties": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" {...s}/>
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" {...s}/>
        <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" {...s}/>
      </svg>
    );
    case "reports": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" {...s}/>
        <path d="M8 17v-5M12 17V7M16 17v-3" {...s}/>
      </svg>
    );
    default: return null;
  }
}
function BottomNav({ active = "keypad", onNavigate }) {
  return (
    <nav style={{ background: "#fff", borderTop: `1px solid ${t.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)" }}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} className="nav-btn" onClick={() => onNavigate?.(item.id)}
          style={{ color: active === item.id ? t.blue : t.muted }}>
          <NavIcon id={item.id} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * TransactionKeypad
 *
 * Props:
 *  - syncOnline         {boolean}               default true
 *  - onTransactionDone  {(txn) => void}          called after success
 *  - onNavigate         {(screenId) => void}
 *  - onScanQR           {() => void}             opens the ScanQR screen
 *  - preselectedCustomer {object|null}           pre-fill customer (e.g. coming from scan result)
 */
export default function TransactionKeypad({
  syncOnline           = true,
  onTransactionDone    = () => {},
  onNavigate           = () => {},
  onScanQR             = () => {},
  preselectedCustomer  = null,
}) {
  const [value,        setValue]       = useState("");
  const [animKey,      setAnimKey]     = useState(0);
  const [shaking,      setShaking]     = useState(false);
  const [customer,     setCustomer]    = useState(preselectedCustomer);
  const [showCustSheet,setCustSheet]   = useState(false);
  const [successData,  setSuccessData] = useState(null);
  const [shown,        setShown]       = useState(false);

  useEffect(() => { const id = setTimeout(() => setShown(true), 60); return () => clearTimeout(id); }, []);
  useEffect(() => { setCustomer(preselectedCustomer); }, [preselectedCustomer]);

  const handlePress = useCallback((key) => {
    setValue(prev => {
      if (key === "." && prev.includes("."))    return prev;
      if (key === "." && prev === "")           return "0.";
      if (prev.includes(".")) {
        const decimals = prev.split(".")[1];
        if (decimals.length >= 2)               return prev;
      }
      if (prev === "0" && key !== ".")          return key;
      const next = prev + key;
      if (next.replace(".", "").length > 9)     return prev;
      return next;
    });
    setAnimKey(k => k + 1);
  }, []);

  const handleDelete = useCallback(() => {
    setValue(prev => prev.slice(0, -1));
    setAnimKey(k => k + 1);
  }, []);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  }, []);

  const handleAction = useCallback((type) => {
    const num = parseFloat(value);
    if (!num || num <= 0) { triggerShake(); return; }
    setSuccessData({ type, amount: parseFloat(value).toLocaleString("en-IN"), customer });
  }, [value, customer, triggerShake]);

  const handleDone = useCallback(() => {
    onTransactionDone(successData);
    setSuccessData(null);
    setValue("");
  }, [successData, onTransactionDone]);

  const handleNewTransaction = useCallback(() => {
    setSuccessData(null);
    setValue("");
    setCustomer(null);
  }, []);

  const disabled = !value || parseFloat(value) <= 0;

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{
        width: "100%", maxWidth: 420, minHeight: "100dvh",
        background: t.bg, display: "flex", flexDirection: "column",
        margin: "0 auto", fontFamily: "'Sora', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        <Topbar syncOnline={syncOnline} onScanQR={onScanQR} />

        {/* â”€â”€ Amount area â”€â”€ */}
        <div style={{
          opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          display: "flex", flexDirection: "column", flex: 1,
        }}>
          {/* Customer chip */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 16, paddingBottom: 6, paddingLeft: 16, paddingRight: 16 }}>
            <CustomerChip
              customer={customer}
              onOpen={() => setCustSheet(true)}
              onClear={() => setCustomer(null)}
            />
          </div>

          {/* Amount */}
          <div style={{ animation: shaking ? "shake 0.35s ease" : "none" }}>
            <AmountDisplay value={value || "0"} animKey={animKey} shake={shaking} />
          </div>

          {/* Numpad + actions */}
          <div style={{
            background: "#fff",
            borderRadius: "22px 22px 0 0",
            padding: "20px 16px 14px",
            boxShadow: "0 -2px 20px rgba(0,0,0,0.06)",
            marginTop: "auto",
          }}>
            <Numpad onPress={handlePress} onDelete={handleDelete} />
            <ActionButtons
              onUdhar={() => handleAction("udhar")}
              onJama={()  => handleAction("jama")}
              disabled={disabled}
            />
          </div>
        </div>

        <BottomNav active="keypad" onNavigate={onNavigate} />

        {/* â”€â”€ Overlays â”€â”€ */}
        {showCustSheet && (
          <CustomerSheet
            onSelect={c => { setCustomer(c); setCustSheet(false); }}
            onScanQR={() => { setCustSheet(false); onScanQR(); }}
            onClose={() => setCustSheet(false)}
          />
        )}

        {successData && (
          <SuccessSheet
            type={successData.type}
            amount={successData.amount}
            customer={successData.customer}
            remarks={successData.remarks}
            onDone={handleDone}
            onNewTransaction={handleNewTransaction}
          />
        )}
      </div>
    </>
  );
}

