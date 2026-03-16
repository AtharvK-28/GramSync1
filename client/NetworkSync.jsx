// NetworkSync.jsx
// GramSync Merchant App — Network & Sync Screen
// Shows: Online/Offline status, upload queue, settings toggles, sync stats
// Deps: pure React, no external libraries

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Design tokens ────────────────────────────────────────────────
const t = {
  blue:        "#2347F5",
  blueMid:     "#3A5BFF",
  bluePale:    "#EEF1FF",
  green:       "#0BAF60",
  greenPale:   "#E6F9F0",
  orange:      "#F56A00",
  orangePale:  "#FFF0E5",
  red:         "#E8304A",
  redPale:     "#FFEBEE",
  yellow:      "#F5A623",
  yellowPale:  "#FFF8E5",
  bg:          "#F0F2F8",
  card:        "#FFFFFF",
  text:        "#0D1226",
  muted:       "#7A85A3",
  border:      "#E2E6F3",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: #F0F2F8; font-family: 'Sora', sans-serif; }
  ::-webkit-scrollbar { display: none; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulseRing {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(1.55); opacity: 0; }
  }
  @keyframes wifiPulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.5; }
  }
  @keyframes progressFill {
    from { width: 0%; }
    to   { width: var(--target-width); }
  }

  .queue-row {
    background: #fff;
    border-radius: 14px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    transition: box-shadow 0.15s;
  }
  .queue-row:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.07); }

  .toggle-track {
    width: 46px; height: 26px;
    border-radius: 99px;
    cursor: pointer;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
    border: none;
    padding: 0;
  }
  .toggle-thumb {
    position: absolute;
    top: 3px;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    transition: left 0.2s cubic-bezier(.22,1,.36,1);
  }

  .stat-card {
    flex: 1;
    background: #fff;
    border-radius: 14px;
    padding: 14px 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .retry-btn {
    border: none;
    border-radius: 8px;
    padding: 5px 12px;
    font-family: 'Sora', sans-serif;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: transform 0.1s, filter 0.1s;
  }
  .retry-btn:active { transform: scale(0.94); filter: brightness(0.92); }

  .sync-all-btn {
    width: 100%;
    padding: 17px;
    border-radius: 16px;
    border: none;
    background: #2347F5;
    color: #fff;
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 4px 18px rgba(35,71,245,0.35);
    transition: transform 0.12s, filter 0.12s;
  }
  .sync-all-btn:hover  { filter: brightness(1.07); }
  .sync-all-btn:active { transform: scale(0.97); }
  .sync-all-btn:disabled { background: #c5cce8; box-shadow: none; cursor: default; }

  .capability-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
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
`;

// ─── Sample queue data ────────────────────────────────────────────
const ONLINE_QUEUE = [
  { id: 1, name: "Suresh Kumar", type: "Udhar", amount: "₹450",  status: "pending",  statusLabel: "Waiting…",    statusColor: "#F5A623" },
  { id: 2, name: "Rohit Nair",   type: "Udhar", amount: "₹350",  status: "retrying", statusLabel: "Retry in 30s", statusColor: "#7A85A3" },
  { id: 3, name: "Sunita Joshi", type: "Jama",  amount: "₹200",  status: "failed",   statusLabel: "RETRY NOW",    statusColor: "#E8304A" },
];

const OFFLINE_QUEUE = [
  { id: 1, name: "Udhar: Ramesh Kumar",     type: "₹1,200 • Pending upload",  icon: "ledger" },
  { id: 2, name: "New Customer: Anita Singh", type: "Profile draft • Pending upload", icon: "person" },
  { id: 3, name: "Jama: Sunil Gupta",       type: "₹500 • Pending upload",    icon: "wallet" },
];

const OFFLINE_WORKS    = ["Record Udhar & Jama transactions", "View full customer ledger history", "Scan QR cards (locally cached)", "Enforce local credit limits"];
const REQUIRES_CONN    = ["New customer OTP verification", "Real-time fraud alerts", "Credit score updates from network"];

// ─── Toggle ───────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button className="toggle-track"
      style={{ background: on ? t.blue : "#D1D5E8" }}
      onClick={() => onChange(!on)}
    >
      <div className="toggle-thumb" style={{ left: on ? 23 : 3 }} />
    </button>
  );
}

// ─── Queue icon ───────────────────────────────────────────────────
function QueueIcon({ type, status }) {
  const bg = status === "failed" ? t.redPale : status === "retrying" ? t.bluePale : "#F0F2F8";
  const color = status === "failed" ? t.red : status === "retrying" ? t.blue : t.muted;

  const icons = {
    ledger: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    person: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
        <path d="M5 20v-1a7 7 0 0114 0v1" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M19 5v4M17 7h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    wallet: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8"/>
        <path d="M2 10h20" stroke={color} strokeWidth="1.8"/>
        <circle cx="17" cy="15" r="1.5" fill={color}/>
      </svg>
    ),
  };

  const statusIcon = status === "pending"  ? (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke={t.muted} strokeWidth="1.8"/>
      <path d="M12 7v5l3 3" stroke={t.muted} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ) : status === "retrying" ? (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 1.5s linear infinite" }}>
      <path d="M4 12a8 8 0 018-8v2m8 6a8 8 0 01-8 8v-2" stroke={t.blue} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill={t.redPale} stroke={t.red} strokeWidth="1.5"/>
      <path d="M12 8v4m0 4h.01" stroke={t.red} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div style={{
      width: 42, height: 42, borderRadius: 12,
      background: bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {type ? icons[type] || statusIcon : statusIcon}
    </div>
  );
}

// ─── Online Status Card ───────────────────────────────────────────
function OnlineStatusCard({ syncing }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 18, padding: "18px 20px",
      margin: "16px 16px 0",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.green, boxShadow: `0 0 6px ${t.green}` }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: t.green }}>Online</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 2 }}>Connected</div>
        <div style={{ fontSize: 12, color: t.muted }}>High speed server connection established</div>
      </div>
      {/* Wifi icon with pulse ring */}
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: t.greenPale,
          animation: syncing ? "pulseRing 1.4s ease-out infinite" : "none",
        }} />
        <div style={{
          position: "relative", width: 56, height: 56, borderRadius: "50%",
          background: t.greenPale,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1,
        }}>
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
            <path d="M5 12.55a11 11 0 0114.08 0" stroke={t.green} strokeWidth="2" strokeLinecap="round"/>
            <path d="M1.42 9a16 16 0 0121.16 0" stroke={t.green} strokeWidth="2" strokeLinecap="round"/>
            <path d="M8.53 16.11a6 6 0 016.95 0" stroke={t.green} strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="20" r="1.5" fill={t.green}/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Offline Status Card ──────────────────────────────────────────
function OfflineStatusCard({ lastSync, onSyncNow }) {
  return (
    <div style={{
      background: "#EEF1FF", borderRadius: 18, padding: "24px 20px",
      margin: "16px 16px 0",
      display: "flex", flexDirection: "column", alignItems: "center",
      textAlign: "center", gap: 10,
    }}>
      {/* Offline cloud icon */}
      <div style={{ position: "relative", marginBottom: 4 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#D6DCF5",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path d="M17 8C17 8 18.5 8.5 19.5 10C20.5 11.5 20 14 18 15H7C4.8 15 3 13.2 3 11C3 9 4.5 7.3 6.5 7C7 4.7 9 3 11.5 3C14.5 3 17 5.3 17 8Z" fill="#A0ABCF" stroke="#A0ABCF" strokeWidth="0.5"/>
            <line x1="4" y1="4" x2="20" y2="20" stroke="#7A85A3" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </div>
        {/* Warning badge */}
        <div style={{
          position: "absolute", bottom: -2, right: -2,
          width: 22, height: 22, borderRadius: "50%",
          background: t.yellow,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid #fff",
        }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
            <path d="M12 9v4m0 4h.01" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <div style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Currently Offline</div>
      <div style={{ fontSize: 13, color: t.muted }}>Last successful sync: {lastSync}</div>

      <button onClick={onSyncNow} style={{
        width: "100%", marginTop: 6,
        padding: "14px", borderRadius: 12,
        background: t.blue, color: "#fff", border: "none",
        fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 15,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        boxShadow: `0 4px 14px rgba(35,71,245,0.3)`,
        transition: "transform 0.1s",
      }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 2s linear infinite" }}>
          <path d="M4 12a8 8 0 018-8v2m8 6a8 8 0 01-8 8v-2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
        Sync Now
      </button>
    </div>
  );
}

// ─── Settings Section (online mode only) ─────────────────────────
function SettingsSection({ offlineMode, autoSync, onToggleOffline, onToggleAutoSync }) {
  return (
    <div style={{ margin: "20px 16px 0" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
        Settings
      </div>
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {[
          {
            label: "Simulate Offline Mode",
            sub: "Test app behavior without internet",
            value: offlineMode,
            onChange: onToggleOffline,
          },
          {
            label: "Auto-sync on Reconnect",
            sub: "Background sync when data is back",
            value: autoSync,
            onChange: onToggleAutoSync,
            divider: false,
          },
        ].map((item, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: t.border, margin: "0 16px" }} />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.label}</div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{item.sub}</div>
              </div>
              <Toggle on={item.value} onChange={item.onChange} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Upload Queue (online) ────────────────────────────────────────
function OnlineQueue({ queue, onRetry }) {
  return (
    <div style={{ margin: "20px 16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Upload Queue
        </div>
        <span style={{
          background: t.bluePale, color: t.blue,
          borderRadius: 99, padding: "3px 10px",
          fontSize: 11, fontWeight: 700,
        }}>{queue.length} Items</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {queue.map(item => (
          <div key={item.id} className="queue-row"
            style={{ border: item.status === "failed" ? `1.5px solid ${t.redPale}` : "none" }}>
            <QueueIcon status={item.status} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.name}</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>
                {item.type} • {item.status === "pending" ? "Pending" : item.status === "retrying" ? "Retrying" : "Failed"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
                {item.amount}
              </div>
              {item.status === "failed" ? (
                <button className="retry-btn" onClick={() => onRetry(item.id)}
                  style={{ background: t.red, color: "#fff" }}>
                  RETRY NOW
                </button>
              ) : item.status === "retrying" ? (
                <span style={{
                  background: t.bluePale, color: t.blue,
                  borderRadius: 8, padding: "3px 10px",
                  fontSize: 11, fontWeight: 600,
                }}>Retry in 30s</span>
              ) : (
                <span style={{ fontSize: 11, color: t.yellow, fontWeight: 600 }}>Waiting…</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Upload Queue (offline) ───────────────────────────────────────
function OfflineQueue({ queue }) {
  const iconMap = { ledger: "ledger", person: "person", wallet: "wallet" };
  return (
    <div style={{ margin: "20px 16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Upload Queue</div>
        <span style={{ fontSize: 12, fontWeight: 700, color: t.muted, letterSpacing: "0.04em" }}>
          {queue.length} ITEMS
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {queue.map(item => (
          <div key={item.id} className="queue-row">
            <QueueIcon type={iconMap[item.icon]} status="pending" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{item.name}</div>
              <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{item.type}</div>
            </div>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke={t.muted} strokeWidth="1.5"/>
              <path d="M12 7v5l3 3" stroke={t.muted} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Capabilities (offline mode) ─────────────────────────────────
function CapabilitiesCard() {
  return (
    <div style={{ margin: "20px 16px 0" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
          What Works Offline
        </div>
        {OFFLINE_WORKS.map((item, i) => (
          <div key={i} className="capability-row">
            <div style={{
              width: 22, height: 22, borderRadius: "50%", background: t.green,
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, color: t.text }}>{item}</span>
          </div>
        ))}

        <div style={{ height: 1, background: t.border, margin: "12px 0" }} />

        <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
          Requires Connection
        </div>
        {REQUIRES_CONN.map((item, i) => (
          <div key={i} className="capability-row">
            <div style={{
              width: 22, height: 22, borderRadius: "50%", background: t.redPale,
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke={t.red} strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, color: t.muted }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sync Stats (online) ──────────────────────────────────────────
function SyncStats({ lastSynced, totalSynced, pendingUpload, failedTxns }) {
  return (
    <div style={{ margin: "16px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {[
        { label: "LAST SYNCED",    value: lastSynced,                    valueColor: t.text   },
        { label: "TOTAL SYNCED",   value: totalSynced.toLocaleString(),  valueColor: t.text   },
        { label: "PENDING UPLOAD", value: pendingUpload,                  valueColor: t.text   },
        { label: "FAILED TXNS",    value: failedTxns, valueColor: failedTxns > 0 ? t.red : t.green },
      ].map((s, i) => (
        <div key={i} className="stat-card">
          <div style={{ fontSize: 10, fontWeight: 700, color: t.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
            {s.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: s.valueColor, fontFamily: "'JetBrains Mono', monospace" }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────
const ONLINE_NAV  = [
  { id: "home",    label: "HOME"    },
  { id: "passbook",label: "PASSBOOK"},
  { id: "network", label: "NETWORK" },
  { id: "profile", label: "PROFILE" },
];

function NavIcon({ id, isOffline }) {
  const s = { stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (id) {
    case "home": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M3 12L12 3l9 9" {...s}/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" {...s}/>
      </svg>
    );
    case "passbook": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h10" {...s}/>
      </svg>
    );
    case "network": return isOffline ? (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M1 1l22 22" {...s}/>
        <path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" {...s}/>
      </svg>
    ) : (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M5 12.55a11 11 0 0114.08 0" {...s}/>
        <path d="M1.42 9a16 16 0 0121.16 0" {...s}/>
        <path d="M8.53 16.11a6 6 0 016.95 0" {...s}/>
        <circle cx="12" cy="20" r="1" fill="currentColor"/>
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

function BottomNav({ active = "network", isOffline = false, onNavigate }) {
  return (
    <nav style={{
      background: "#fff", borderTop: `1px solid ${t.border}`,
      display: "flex", zIndex: 100,
    }}>
      {ONLINE_NAV.map(item => (
        <button key={item.id} className="nav-btn" onClick={() => onNavigate?.(item.id)}
          style={{ color: active === item.id ? t.blue : t.muted }}>
          <NavIcon id={item.id} isOffline={isOffline} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Main Component ───────────────────────────────────────────────

/**
 * NetworkSync
 *
 * Props:
 *  - isOnline          {boolean}   default true
 *  - lastSync          {string}    e.g. "Just now" | "2 hours ago"
 *  - totalSynced       {number}
 *  - pendingUpload     {number}
 *  - failedTxns        {number}
 *  - onlineQueue       {Array}
 *  - offlineQueue      {Array}
 *  - onNavigate        {(id) => void}
 *  - onBack            {() => void}
 *  - onSyncAll         {() => void}
 */
export default function NetworkSync({
  isOnline      = true,
  lastSync      = "Just now",
  totalSynced   = 1284,
  pendingUpload = 0,
  failedTxns    = 1,
  onlineQueue   = ONLINE_QUEUE,
  offlineQueue  = OFFLINE_QUEUE,
  onNavigate    = () => {},
  onBack        = () => {},
  onSyncAll     = () => {},
}) {
  const [offline,     setOffline]    = useState(!isOnline);
  const [autoSync,    setAutoSync]   = useState(true);
  const [syncing,     setSyncing]    = useState(false);
  const [queue,       setQueue]      = useState(onlineQueue);
  const [shown,       setShown]      = useState(false);

  useEffect(() => { const id = setTimeout(() => setShown(true), 60); return () => clearTimeout(id); }, []);

  const handleSyncAll = useCallback(() => {
    setSyncing(true);
    onSyncAll();
    setTimeout(() => setSyncing(false), 2500);
  }, [onSyncAll]);

  const handleRetry = useCallback((id) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: "retrying", statusLabel: "Retry in 30s" } : q));
  }, []);

  const handleSyncNow = useCallback(() => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); setOffline(false); }, 2000);
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{
        width: "100%", maxWidth: 420, minHeight: "100vh",
        background: t.bg, display: "flex", flexDirection: "column",
        margin: "0 auto", fontFamily: "'Sora', sans-serif",
      }}>
        {/* Topbar */}
        <div style={{
          background: "#fff", padding: "16px 20px 14px",
          display: "flex", alignItems: "center", gap: 12,
          borderBottom: `1px solid ${t.border}`,
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <button onClick={onBack} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center",
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.text }}>Network & Sync</div>
        </div>

        {/* Scrollable body */}
        <div style={{
          flex: 1, overflowY: "auto", paddingBottom: 24,
          opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}>
          {offline ? (
            <>
              <OfflineStatusCard lastSync="2 hours ago" onSyncNow={handleSyncNow} />
              <OfflineQueue queue={offlineQueue} />
              <CapabilitiesCard />
            </>
          ) : (
            <>
              <OnlineStatusCard syncing={syncing} />
              <SettingsSection
                offlineMode={offline}
                autoSync={autoSync}
                onToggleOffline={setOffline}
                onToggleAutoSync={setAutoSync}
              />
              <OnlineQueue queue={queue} onRetry={handleRetry} />
              <SyncStats
                lastSynced={lastSync}
                totalSynced={totalSynced}
                pendingUpload={pendingUpload}
                failedTxns={failedTxns}
              />
            </>
          )}
          <div style={{ height: 20 }} />
        </div>

        {/* Sync All Data button */}
        {!offline && (
          <div style={{ padding: "12px 16px 8px", background: "#fff", borderTop: `1px solid ${t.border}` }}>
            <button className="sync-all-btn" onClick={handleSyncAll} disabled={syncing}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"
                style={{ animation: syncing ? "spin 1s linear infinite" : "none" }}>
                <path d="M4 12a8 8 0 018-8v2m8 6a8 8 0 01-8 8v-2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M12 4l2-2-2-2M12 20l-2 2 2 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {syncing ? "Syncing…" : "Sync All Data"}
            </button>
          </div>
        )}

        <BottomNav active="network" isOffline={offline} onNavigate={onNavigate} />
      </div>
    </>
  );
}