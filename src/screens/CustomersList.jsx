// CustomersList.jsx
// GramSync Merchant App â€” Customers Screen
// Fonts: Sora + JetBrains Mono (loaded via global CSS injection)
// Deps: pure React, no external libraries

import { useState, useEffect, useRef } from "react";

// â”€â”€â”€ Design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const t = {
  blue:       "#2347F5",
  blueMid:    "#3A5BFF",
  bluePale:   "#EEF1FF",
  green:      "#0BAF60",
  greenPale:  "#E6F9F0",
  orange:     "#F56A00",
  orangePale: "#FFF0E5",
  red:        "#E8304A",
  redPale:    "#FFEBEE",
  yellow:     "#F5A623",
  yellowPale: "#FFF8E5",
  bg:         "#F0F2F8",
  card:       "#FFFFFF",
  text:       "#0D1226",
  muted:      "#7A85A3",
  border:     "#E2E6F3",
};

// â”€â”€â”€ Default customer data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DEFAULT_CUSTOMERS = [
  {
    id: 1,
    name: "Suresh Kumar",
    phone: "+91 98765 43210",
    initials: "SK",
    score: 842,
    maxScore: 900,
    status: "safe",
    balanceLabel: "â‚¹2,550",
    balanceSub: "Today",
    balanceSubColor: t.muted,
    balanceColor: t.text,
  },
  {
    id: 2,
    name: "Priya Devi",
    phone: "+91 98221 55667",
    initials: "PD",
    score: 512,
    maxScore: 900,
    status: "caution",
    balanceLabel: "â‚¹8,400",
    balanceSub: "Overdue",
    balanceSubColor: t.red,
    balanceColor: t.red,
  },
  {
    id: 3,
    name: "Mahesh Khatri",
    phone: "+91 91100 22334",
    initials: "MK",
    score: null,
    maxScore: 900,
    status: "new",
    balanceLabel: null,
    balanceSub: "Verify Profile",
    balanceSubColor: t.blue,
    balanceColor: t.blue,
  },
  {
    id: 4,
    name: "Anita Verma",
    phone: "+91 94455 66778",
    initials: "AV",
    score: 710,
    maxScore: 900,
    status: "safe",
    balanceLabel: "Cleared",
    balanceSub: "Yesterday",
    balanceSubColor: t.muted,
    balanceColor: t.green,
  },
  {
    id: 5,
    name: "Rohit Nair",
    phone: "+91 95566 77889",
    initials: "RN",
    score: 245,
    maxScore: 900,
    status: "high-risk",
    balanceLabel: "â‚¹12,200",
    balanceSub: "Defaulter",
    balanceSubColor: t.red,
    balanceColor: t.red,
  },
  {
    id: 6,
    name: "Kavita Singh",
    phone: "+91 96677 88990",
    initials: "KS",
    score: 790,
    maxScore: 900,
    status: "safe",
    balanceLabel: "â‚¹1,120",
    balanceSub: "Today",
    balanceSubColor: t.muted,
    balanceColor: t.text,
  },
];

// â”€â”€â”€ Status config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STATUS_CONFIG = {
  safe:      { label: "SAFE TO LEND", badgeBg: t.greenPale,   badgeColor: t.green,   dotColor: t.green,   barColor: t.green,   avatarBg: t.greenPale,  avatarColor: t.green,  borderLeft: null },
  caution:   { label: "CAUTION",      badgeBg: t.yellowPale,  badgeColor: t.yellow,  dotColor: t.yellow,  barColor: t.yellow,  avatarBg: t.yellowPale, avatarColor: t.yellow, borderLeft: null },
  "high-risk":{ label: "HIGH RISK",   badgeBg: t.redPale,     badgeColor: t.red,     dotColor: t.red,     barColor: t.red,     avatarBg: t.redPale,    avatarColor: t.red,    borderLeft: `3px solid ${t.red}` },
  new:       { label: "NEW CUSTOMER", badgeBg: t.bluePale,    badgeColor: t.blue,    dotColor: t.blue,    barColor: t.blue,    avatarBg: t.bluePale,   avatarColor: t.blue,   borderLeft: null },
};

const LEGEND = [
  { key: "safe",      label: "Safe"      },
  { key: "caution",   label: "Caution"   },
  { key: "high-risk", label: "High Risk" },
  { key: "new",       label: "New"       },
];

const FILTER_TABS = ["All", "Safe", "Caution", "High Risk", "New"];

// â”€â”€â”€ Injected global styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: #F0F2F8; font-family: 'Sora', sans-serif; }
  ::-webkit-scrollbar { display: none; }

  .cust-card-wrap {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .cust-card-inner {
    background: #fff;
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    cursor: pointer;
    transition: box-shadow 0.18s ease, transform 0.14s ease;
  }
  .cust-card-inner:hover {
    box-shadow: 0 4px 18px rgba(35,71,245,0.10);
    transform: translateY(-1px);
  }
  .cust-card-inner:active {
    transform: scale(0.98);
    box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  }
  .filter-chip {
    border: 1.5px solid;
    border-radius: 99px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    font-family: 'Sora', sans-serif;
  }
  .search-input:focus {
    outline: none;
    border-color: #2347F5;
    box-shadow: 0 0 0 3px rgba(35,71,245,0.10);
  }
  .score-bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.7s cubic-bezier(.22,1,.36,1);
  }
  .verify-link {
    color: #2347F5;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .verify-link:hover { opacity: 0.7; }
`;

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Avatar({ initials, bg, color, size = 42 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.31,
      fontFamily: "'Sora', sans-serif",
    }}>
      {initials}
    </div>
  );
}

function Badge({ label, bg, color }) {
  return (
    <span style={{
      display: "inline-block", borderRadius: 6,
      fontSize: 10, fontWeight: 700, padding: "3px 8px",
      letterSpacing: "0.04em", background: bg, color,
      fontFamily: "'Sora', sans-serif", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function ScoreBar({ score, maxScore, color, animate }) {
  const pct = score ? Math.round((score / maxScore) * 100) : 0;
  return (
    <div style={{ flex: 1, height: 5, background: t.border, borderRadius: 99, overflow: "hidden" }}>
      <div
        className="score-bar-fill"
        style={{
          width: animate ? `${pct}%` : "0%",
          background: color,
        }}
      />
    </div>
  );
}

// â”€â”€â”€ Topbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Topbar({ onNotification, onBack }) {
  return (
    <div style={{
      background: "#fff",
      padding: "16px 20px 14px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: `1px solid ${t.border}`,
      position: "sticky", top: 0, zIndex: 50,
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          marginRight: 8, padding: 4, display: "flex", alignItems: "center",
        }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      <div style={{ fontSize: 18, fontWeight: 700, color: t.text, flex: 1 }}>Customers</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onNotification} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              stroke={t.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="1" fill={t.text}/>
            <circle cx="19" cy="12" r="1" fill={t.text}/>
            <circle cx="5"  cy="12" r="1" fill={t.text}/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Search Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SearchBar({ value, onChange }) {
  return (
    <div style={{ margin: "14px 16px 0", position: "relative" }}>
      <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
        width="18" height="18" fill="none" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" stroke={t.muted} strokeWidth="1.8"/>
        <path d="M21 21l-4.35-4.35" stroke={t.muted} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      <input
        className="search-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search by name or number"
        style={{
          width: "100%", padding: "12px 16px 12px 42px",
          borderRadius: 12, border: `1.5px solid ${t.border}`,
          fontFamily: "'Sora', sans-serif", fontSize: 14, color: t.text,
          background: "#fff", transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      />
      {value && (
        <button onClick={() => onChange("")} style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: t.border, border: "none", borderRadius: "50%",
          width: 20, height: 20, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: t.muted, fontSize: 12, fontWeight: 700,
        }}>Ã—</button>
      )}
    </div>
  );
}

// â”€â”€â”€ Legend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Legend() {
  return (
    <div style={{ display: "flex", gap: 10, margin: "12px 16px 14px", flexWrap: "wrap", alignItems: "center" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: t.muted, textTransform: "uppercase", marginRight: 2 }}>
        Score
      </div>
      {LEGEND.map(item => {
        const cfg = STATUS_CONFIG[item.key];
        return (
          <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dotColor }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: t.muted }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// â”€â”€â”€ Filter Chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FilterChips({ active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 8, padding: "0 16px 14px",
      overflowX: "auto", scrollbarWidth: "none",
    }}>
      {FILTER_TABS.map(tab => {
        const isActive = active === tab;
        return (
          <button
            key={tab}
            className="filter-chip"
            onClick={() => onChange(tab)}
            style={{
              background: isActive ? t.blue : "#fff",
              color: isActive ? "#fff" : t.muted,
              borderColor: isActive ? t.blue : t.border,
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

// â”€â”€â”€ Customer Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CustomerCard({ customer, index, shown, onPress }) {
  const cfg = STATUS_CONFIG[customer.status];

  return (
    <div
      className="cust-card-wrap"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(14px)",
        transitionDelay: `${index * 60}ms`,
      }}
    >
      <div
        className="cust-card-inner"
        style={{ borderLeft: cfg.borderLeft || "none" }}
        onClick={() => onPress?.(customer)}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Avatar initials={customer.initials} bg={cfg.avatarBg} color={cfg.avatarColor} size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{customer.name}</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{customer.phone}</div>
          </div>
          <Badge label={cfg.label} bg={cfg.badgeBg} color={cfg.badgeColor} />
        </div>

        {/* Score row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 10, color: t.muted, fontWeight: 600, minWidth: 70 }}>Gram Score</div>

          {customer.score !== null ? (
            <>
              <ScoreBar score={customer.score} maxScore={customer.maxScore} color={cfg.barColor} animate={shown} />
              <div style={{
                fontSize: 11, fontWeight: 700, minWidth: 50, textAlign: "right",
                fontFamily: "'JetBrains Mono', monospace", color: cfg.barColor,
              }}>
                {customer.score}/{customer.maxScore}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, fontSize: 11, color: t.muted }}>N/A</div>
          )}

          {/* Balance */}
          <div style={{ textAlign: "right", minWidth: 64 }}>
            {customer.balanceLabel && (
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: customer.balanceColor,
                fontFamily: customer.balanceLabel.startsWith("â‚¹") ? "'JetBrains Mono', monospace" : "'Sora', sans-serif",
              }}>
                {customer.balanceLabel}
              </div>
            )}
            {customer.status === "new" ? (
              <span className="verify-link">{customer.balanceSub} â†’</span>
            ) : (
              <div style={{ fontSize: 10, color: customer.balanceSubColor, marginTop: customer.balanceLabel ? 2 : 0 }}>
                {customer.balanceSub}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Empty State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EmptyState({ query }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 24px", gap: 12,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", background: t.bluePale,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" stroke={t.blue} strokeWidth="1.8"/>
          <path d="M21 21l-4.35-4.35" stroke={t.blue} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>No customers found</div>
      <div style={{ fontSize: 13, color: t.muted, textAlign: "center" }}>
        {query ? `No results for "${query}"` : "No customers in this category yet."}
      </div>
    </div>
  );
}

// â”€â”€â”€ Bottom Nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NAV_ITEMS = [
  { id: "home",      label: "HOME"      },
  { id: "customers", label: "CUSTOMERS" },
  { id: "reports",   label: "REPORTS"   },
  { id: "settings",  label: "SETTINGS"  },
];

function NavIcon({ id }) {
  const s = { stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (id) {
    case "home": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M3 12L12 3l9 9" {...s}/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" {...s}/>
      </svg>
    );
    case "customers": return (
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
    case "settings": return (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" {...s}/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...s}/>
      </svg>
    );
    default: return null;
  }
}

function BottomNav({ active = "customers", onNavigate }) {
  return (
    <nav style={{
      position: "sticky", bottom: 0,
      background: "#fff", borderTop: `1px solid ${t.border}`,
      display: "flex", zIndex: 100,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate?.(item.id)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "10px 0 12px", gap: 4, cursor: "pointer",
            border: "none", background: "none",
            color: active === item.id ? t.blue : t.muted,
            fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 500,
            transition: "color 0.15s",
          }}
        >
          <NavIcon id={item.id} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// â”€â”€â”€ Summary Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SummaryBar({ customers }) {
  const safe     = customers.filter(c => c.status === "safe").length;
  const caution  = customers.filter(c => c.status === "caution").length;
  const highRisk = customers.filter(c => c.status === "high-risk").length;
  const newCust  = customers.filter(c => c.status === "new").length;

  return (
    <div style={{
      display: "flex", gap: 0, margin: "0 16px 14px",
      background: "#fff", borderRadius: 12, overflow: "hidden",
      border: `1px solid ${t.border}`,
    }}>
      {[
        { count: safe,     label: "Safe",      color: t.green  },
        { count: caution,  label: "Caution",   color: t.yellow },
        { count: highRisk, label: "High Risk", color: t.red    },
        { count: newCust,  label: "New",       color: t.blue   },
      ].map((item, i) => (
        <div key={i} style={{
          flex: 1, padding: "10px 4px", textAlign: "center",
          borderRight: i < 3 ? `1px solid ${t.border}` : "none",
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>
            {item.count}
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 1 }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * CustomersList
 *
 * Props:
 *  - customers     {Array}    â€” list of customer objects (defaults to sample data)
 *  - onCustomerPress {(customer) => void}
 *  - onNavigate    {(screenId: string) => void}
 *  - onNotification {() => void}
 *  - onBack        {() => void | undefined}  â€” shows back arrow if provided
 */
export default function CustomersList({
  customers       = DEFAULT_CUSTOMERS,
  onCustomerPress = () => {},
  onNavigate      = () => {},
  onNotification  = () => {},
  onBack,
}) {
  const [query,       setQuery]       = useState("");
  const [activeFilter, setFilter]     = useState("All");
  const [shown,       setShown]       = useState(false);
  const listRef = useRef(null);

  // Staggered entrance
  useEffect(() => {
    const id = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(id);
  }, []);

  // Re-animate on filter change
  const handleFilter = (tab) => {
    setShown(false);
    setFilter(tab);
    setTimeout(() => setShown(true), 80);
  };

  // Filtering
  const filtered = customers.filter(c => {
    const matchSearch = !query ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query);
    const matchFilter = activeFilter === "All" ||
      (activeFilter === "Safe"      && c.status === "safe") ||
      (activeFilter === "Caution"   && c.status === "caution") ||
      (activeFilter === "High Risk" && c.status === "high-risk") ||
      (activeFilter === "New"       && c.status === "new");
    return matchSearch && matchFilter;
  });

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{
        width: "100%", maxWidth: 420, minHeight: "100dvh",
        background: t.bg, display: "flex", flexDirection: "column",
        margin: "0 auto", fontFamily: "'Sora', sans-serif",
      }}>
        <Topbar onNotification={onNotification} onBack={onBack} />

        {/* Scrollable content */}
        <div ref={listRef} style={{ flex: 1, overflowY: "auto", paddingBottom: "calc(20px + env(safe-area-inset-bottom) + 64px)" }}>
          <SearchBar value={query} onChange={v => { setQuery(v); setShown(false); setTimeout(() => setShown(true), 60); }} />
          <Legend />
          <SummaryBar customers={customers} />
          <FilterChips active={activeFilter} onChange={handleFilter} />

          {/* Customer cards */}
          <div style={{ margin: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.length > 0 ? (
              filtered.map((customer, i) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  index={i}
                  shown={shown}
                  onPress={onCustomerPress}
                />
              ))
            ) : (
              <EmptyState query={query} />
            )}
          </div>

          {/* Results count */}
          {filtered.length > 0 && (
            <div style={{
              textAlign: "center", margin: "16px 0 8px",
              fontSize: 11, color: t.muted, fontWeight: 500,
            }}>
              Showing {filtered.length} of {customers.length} customers
            </div>
          )}
        </div>

        <BottomNav active="customers" onNavigate={onNavigate} />
      </div>
    </>
  );
}
