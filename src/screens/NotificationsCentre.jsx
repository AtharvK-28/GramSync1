// NotificationsCentre.jsx
// GramSync Merchant App — Notifications Centre
// Features: grouped notifications (Today / Earlier), category filter tabs,
//           read/unread states, swipe-to-dismiss, action buttons per type,
//           mark-all-read, clear-all, empty state
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
  purple:      "#7C3AED",
  purplePale:  "#F3EEFF",
  bg:          "#F0F2F8",
  card:        "#FFFFFF",
  text:        "#0D1226",
  muted:       "#7A85A3",
  border:      "#E2E6F3",
};

// ─── Notification types config ────────────────────────────────────
const TYPE_CONFIG = {
  overdue: {
    label:   "Overdue",
    iconBg:  t.redPale,
    iconColor: t.red,
    dot:     t.red,
    badgeBg: t.redPale,
    badgeColor: t.red,
  },
  payment: {
    label:   "Payment",
    iconBg:  t.greenPale,
    iconColor: t.green,
    dot:     t.green,
    badgeBg: t.greenPale,
    badgeColor: t.green,
  },
  fraud: {
    label:   "Fraud Alert",
    iconBg:  t.orangePale,
    iconColor: t.orange,
    dot:     t.orange,
    badgeBg: t.orangePale,
    badgeColor: t.orange,
  },
  sync: {
    label:   "Sync",
    iconBg:  t.bluePale,
    iconColor: t.blue,
    dot:     t.blue,
    badgeBg: t.bluePale,
    badgeColor: t.blue,
  },
  system: {
    label:   "System",
    iconBg:  "#F3EEFF",
    iconColor: t.purple,
    dot:     t.purple,
    badgeBg: "#F3EEFF",
    badgeColor: t.purple,
  },
  reminder: {
    label:   "Reminder",
    iconBg:  t.yellowPale,
    iconColor: t.yellow,
    dot:     t.yellow,
    badgeBg: t.yellowPale,
    badgeColor: t.yellow,
  },
};

// ─── Sample notifications ─────────────────────────────────────────
const INITIAL_NOTIFICATIONS = [
  // Today
  {
    id: 1, group: "Today", type: "overdue", read: false,
    title: "Payment overdue — Rohit Nair",
    body: "₹12,200 has been outstanding for 14 days. Send a reminder now.",
    time: "10:45 AM",
    actions: [{ label: "Send Reminder", primary: true }, { label: "View Profile" }],
    meta: { customer: "Rohit Nair", amount: "₹12,200", initials: "RN" },
  },
  {
    id: 2, group: "Today", type: "payment", read: false,
    title: "Payment received — Anita Verma",
    body: "₹1,500 collected. Balance cleared. Customer is now debt-free.",
    time: "09:12 AM",
    actions: [{ label: "View Receipt" }],
    meta: { customer: "Anita Verma", amount: "+₹1,500", initials: "AV" },
  },
  {
    id: 3, group: "Today", type: "fraud", read: false,
    title: "Unusual activity detected",
    body: "Suresh Kumar attempted 4 credit requests in 30 minutes. Review before approving.",
    time: "08:30 AM",
    actions: [{ label: "Block Credit", primary: true }, { label: "Dismiss" }],
    meta: { customer: "Suresh Kumar", initials: "SK" },
  },
  {
    id: 4, group: "Today", type: "sync", read: true,
    title: "Sync completed successfully",
    body: "All 34 pending transactions have been synced to the cloud.",
    time: "07:00 AM",
    actions: [],
    meta: { count: 34 },
  },
  // Earlier
  {
    id: 5, group: "Earlier", type: "overdue", read: true,
    title: "Payment overdue — Priya Devi",
    body: "₹8,400 outstanding for 7 days. Balance is growing — consider limiting credit.",
    time: "Yesterday",
    actions: [{ label: "Send Reminder", primary: true }, { label: "View Profile" }],
    meta: { customer: "Priya Devi", amount: "₹8,400", initials: "PD" },
  },
  {
    id: 6, group: "Earlier", type: "reminder", read: true,
    title: "Weekly collection reminder",
    body: "You have 5 customers with balances over ₹2,000. Consider reaching out this week.",
    time: "Mon, 9:00 AM",
    actions: [{ label: "View Report" }],
    meta: { count: 5 },
  },
  {
    id: 7, group: "Earlier", type: "system", read: true,
    title: "GramSync Pro plan renewed",
    body: "Your monthly subscription has been renewed. Next billing: Nov 15, 2024.",
    time: "Sun, 11:00 AM",
    actions: [{ label: "View Invoice" }],
    meta: {},
  },
  {
    id: 8, group: "Earlier", type: "payment", read: true,
    title: "Bulk payment — Kavita Singh",
    body: "₹3,200 received in two instalments. Outstanding balance: ₹0.",
    time: "Sat, 4:20 PM",
    actions: [{ label: "View Receipt" }],
    meta: { customer: "Kavita Singh", amount: "+₹3,200", initials: "KS" },
  },
  {
    id: 9, group: "Earlier", type: "fraud", read: true,
    title: "Low Gram Score alert",
    body: "Mahesh Khatri's score dropped to 245/900 due to missed payments on the network.",
    time: "Fri, 2:15 PM",
    actions: [{ label: "View Score" }, { label: "Limit Credit" }],
    meta: { customer: "Mahesh Khatri", initials: "MK" },
  },
];

// ─── Global CSS ───────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  body { background:#F0F2F8; font-family:'Sora',sans-serif; }
  ::-webkit-scrollbar { display:none; }

  @keyframes fadeSlideIn {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes slideOutRight {
    from { opacity:1; transform:translateX(0)   max-height:200px; }
    to   { opacity:0; transform:translateX(100%); max-height:0; margin:0; padding:0; }
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes sheetUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pulseRed {
    0%,100% { box-shadow: 0 0 0 0 rgba(232,48,74,0); }
    50%      { box-shadow: 0 0 0 6px rgba(232,48,74,0.15); }
  }

  .notif-card {
    background:#fff;
    border-radius:16px;
    padding:14px 16px;
    box-shadow:0 1px 4px rgba(0,0,0,0.05);
    cursor:pointer;
    transition:box-shadow 0.15s, transform 0.12s, opacity 0.25s, max-height 0.3s;
    position:relative;
    overflow:hidden;
  }
  .notif-card:hover { box-shadow:0 3px 14px rgba(0,0,0,0.08); }
  .notif-card:active { transform:scale(0.985); }
  .notif-card.unread { border-left:3px solid transparent; }
  .notif-card.dismissing {
    opacity:0 !important;
    transform:translateX(110%) !important;
    transition:opacity 0.25s ease, transform 0.25s ease !important;
    pointer-events:none;
    max-height:0 !important;
    margin:0 !important;
    padding:0 !important;
    overflow:hidden;
  }

  .filter-chip {
    border:1.5px solid;
    border-radius:99px;
    padding:6px 14px;
    font-size:12px;
    font-weight:600;
    cursor:pointer;
    white-space:nowrap;
    transition:background 0.15s, color 0.15s, border-color 0.15s;
    font-family:'Sora',sans-serif;
    background:none;
  }

  .action-pill {
    border:none;
    border-radius:99px;
    padding:7px 14px;
    font-size:12px;
    font-weight:700;
    cursor:pointer;
    font-family:'Sora',sans-serif;
    transition:transform 0.1s, filter 0.1s;
    white-space:nowrap;
  }
  .action-pill:active { transform:scale(0.93); filter:brightness(0.92); }

  .dismiss-btn {
    position:absolute;
    top:10px; right:10px;
    background:none; border:none;
    width:24px; height:24px;
    border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; color:#B0B8CC;
    transition:background 0.12s, color 0.12s;
    opacity:0;
    transition:opacity 0.15s;
  }
  .notif-card:hover .dismiss-btn { opacity:1; }
  .dismiss-btn:hover { background:#F0F2F8; color:#7A85A3; }

  .nav-btn {
    flex:1; display:flex; flex-direction:column; align-items:center;
    padding:10px 0 12px; gap:4px; cursor:pointer;
    border:none; background:none;
    font-family:'Sora',sans-serif; font-size:10px; font-weight:500;
    transition:color 0.15s;
  }

  .mark-read-btn {
    background:none; border:none; cursor:pointer;
    font-family:'Sora',sans-serif; font-size:12px; font-weight:600;
    color:#2347F5; padding:0;
    transition:opacity 0.15s;
  }
  .mark-read-btn:hover { opacity:0.7; }

  .empty-state {
    display:flex; flex-direction:column; align-items:center;
    justify-content:center; padding:60px 32px; gap:14px;
    animation:fadeSlideIn 0.3s ease;
  }

  .sheet-overlay {
    position:fixed; inset:0; z-index:200;
    background:rgba(13,18,38,0.55);
    display:flex; align-items:flex-end;
    animation:fadeIn 0.18s ease;
  }
  .sheet-body {
    background:#fff; border-radius:22px 22px 0 0;
    width:100%; padding:24px 20px 36px;
    animation:sheetUp 0.26s cubic-bezier(.22,1,.36,1);
    box-shadow:0 -8px 40px rgba(0,0,0,0.15);
  }
`;

// ─── Notification Icon ────────────────────────────────────────────
function NotifIcon({ type, size = 44 }) {
  const cfg = TYPE_CONFIG[type];
  const icons = {
    overdue:  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={cfg.iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
    payment:  <><path d="M12 5v14M19 12l-7 7-7-7" stroke={cfg.iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></>,
    fraud:    <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={cfg.iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke={cfg.iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    sync:     <><path d="M4 12a8 8 0 018-8v2m8 6a8 8 0 01-8 8v-2" stroke={cfg.iconColor} strokeWidth="2" strokeLinecap="round"/><path d="M12 4l2-2-2-2M12 20l-2 2 2 2" stroke={cfg.iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    system:   <><circle cx="12" cy="12" r="3" stroke={cfg.iconColor} strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={cfg.iconColor} strokeWidth="1.8"/></>,
    reminder: <><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke={cfg.iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
  };

  return (
    <div style={{
      width: size, height: size,
      borderRadius: 14,
      background: cfg.iconBg,
      flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        {icons[type]}
      </svg>
    </div>
  );
}

// ─── Unread dot ───────────────────────────────────────────────────
function UnreadDot({ type, animate = false }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%",
      background: cfg.dot, flexShrink: 0, marginTop: 6,
      animation: animate && type === "overdue" ? "pulseRed 2s ease-in-out infinite" : "none",
    }}/>
  );
}

// ─── Action Pills ─────────────────────────────────────────────────
function ActionPills({ actions, type, onAction }) {
  if (!actions || actions.length === 0) return null;
  const cfg = TYPE_CONFIG[type];
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      {actions.map((a, i) => (
        <button
          key={i}
          className="action-pill"
          onClick={e => { e.stopPropagation(); onAction(a.label); }}
          style={{
            background: a.primary ? cfg.iconColor : cfg.iconBg,
            color:      a.primary ? "#fff"         : cfg.iconColor,
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ─── Single Notification Card ─────────────────────────────────────
function NotifCard({ notif, onDismiss, onRead, onAction, animIndex }) {
  const [dismissing, setDismissing] = useState(false);
  const cfg = TYPE_CONFIG[notif.type];

  const handleDismiss = useCallback((e) => {
    e.stopPropagation();
    setDismissing(true);
    setTimeout(() => onDismiss(notif.id), 260);
  }, [notif.id, onDismiss]);

  const handleClick = useCallback(() => {
    if (!notif.read) onRead(notif.id);
  }, [notif.id, notif.read, onRead]);

  return (
    <div
      className={`notif-card${notif.unread ? " unread" : ""}${dismissing ? " dismissing" : ""}`}
      onClick={handleClick}
      style={{
        borderLeftColor: !notif.read ? cfg.dot : "transparent",
        borderLeftWidth: !notif.read ? 3 : 0,
        borderLeftStyle: "solid",
        animation: `fadeSlideIn 0.3s ease ${animIndex * 40}ms both`,
        background: !notif.read ? "#FAFBFF" : "#fff",
      }}
    >
      {/* Dismiss X */}
      <button className="dismiss-btn" onClick={handleDismiss} title="Dismiss">
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Top row */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <NotifIcon type={notif.type}/>

        <div style={{ flex: 1, paddingRight: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <div style={{
              fontSize: 13, fontWeight: notif.read ? 600 : 700,
              color: t.text, lineHeight: 1.4, flex: 1,
            }}>
              {notif.title}
            </div>
            {!notif.read && <UnreadDot type={notif.type} animate />}
          </div>

          <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.6, marginBottom: 4 }}>
            {notif.body}
          </div>

          {/* Meta chips */}
          {notif.meta?.customer && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: cfg.iconBg, color: cfg.iconColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, flexShrink: 0,
              }}>
                {notif.meta.initials}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.muted }}>{notif.meta.customer}</span>
              {notif.meta.amount && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: notif.meta.amount.startsWith("+") ? t.green : t.orange,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {notif.meta.amount}
                </span>
              )}
            </div>
          )}

          {/* Time + type badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: t.muted }}>{notif.time}</span>
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: cfg.badgeBg, color: cfg.badgeColor,
              borderRadius: 6, padding: "2px 7px",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              {cfg.label}
            </span>
          </div>

          <ActionPills actions={notif.actions} type={notif.type} onAction={onAction}/>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────
function EmptyState({ filter }) {
  return (
    <div className="empty-state">
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: t.bluePale,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            stroke={t.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>
        {filter === "All" ? "You're all caught up!" : `No ${filter} notifications`}
      </div>
      <div style={{ fontSize: 13, color: t.muted, textAlign: "center", lineHeight: 1.6 }}>
        {filter === "All"
          ? "New alerts for payments, overdue balances, and fraud will appear here."
          : `No ${TYPE_CONFIG[filter]?.label || filter} alerts at the moment.`}
      </div>
    </div>
  );
}

// ─── Clear All Confirm Sheet ──────────────────────────────────────
function ClearAllSheet({ count, onConfirm, onClose }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-body" onClick={e => e.stopPropagation()}>
        <div style={{ width:38, height:4, borderRadius:99, background:t.border, margin:"0 auto 20px" }}/>

        <div style={{
          width:56, height:56, borderRadius:"50%", background:t.redPale,
          display:"flex", alignItems:"center", justifyContent:"center",
          margin:"0 auto 14px",
        }}>
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              stroke={t.red} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:17, fontWeight:800, color:t.text, marginBottom:8 }}>Clear all notifications?</div>
          <div style={{ fontSize:13, color:t.muted, lineHeight:1.6 }}>
            This will permanently remove all {count} notification{count !== 1 ? "s" : ""}. This action cannot be undone.
          </div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{
            flex:1, padding:14, borderRadius:12,
            background:t.bg, color:t.muted, border:`1.5px solid ${t.border}`,
            fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex:1, padding:14, borderRadius:12,
            background:t.red, color:"#fff", border:"none",
            fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer",
          }}>Clear All</button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Sheet ───────────────────────────────────────────────
function SettingsSheet({ prefs, onChange, onClose }) {
  const items = [
    { key:"overdue",  label:"Overdue alerts",       sub:"When a customer balance passes due date" },
    { key:"payment",  label:"Payment received",      sub:"When a customer makes a payment"         },
    { key:"fraud",    label:"Fraud & risk alerts",   sub:"Unusual activity and score drops"        },
    { key:"sync",     label:"Sync notifications",    sub:"When offline data syncs to cloud"        },
    { key:"reminder", label:"Weekly reminders",      sub:"Scheduled collection nudges"             },
    { key:"system",   label:"System & billing",      sub:"Plan renewals and app updates"           },
  ];

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-body" onClick={e => e.stopPropagation()} style={{ maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ width:38, height:4, borderRadius:99, background:t.border, margin:"0 auto 20px" }}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:700, color:t.text }}>Notification Preferences</div>
          <button onClick={onClose} style={{
            background:t.bg, border:"none", borderRadius:"50%", width:30, height:30,
            cursor:"pointer", color:t.muted, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, fontWeight:700,
          }}>×</button>
        </div>

        <div style={{ background:"#fff", borderRadius:16, overflow:"hidden", border:`1px solid ${t.border}` }}>
          {items.map((item, i) => (
            <div key={item.key}>
              {i > 0 && <div style={{ height:1, background:t.border, margin:"0 16px" }}/>}
              <div style={{ display:"flex", alignItems:"center", padding:"14px 16px", gap:12 }}>
                <div style={{
                  width:36, height:36, borderRadius:10,
                  background: TYPE_CONFIG[item.key]?.iconBg || t.bluePale,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                }}>
                  <NotifIcon type={item.key}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:t.text }}>{item.label}</div>
                  <div style={{ fontSize:11, color:t.muted, marginTop:1 }}>{item.sub}</div>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => onChange(item.key, !prefs[item.key])}
                  style={{
                    width:46, height:26, borderRadius:99,
                    background: prefs[item.key] ? t.blue : "#D1D5E8",
                    border:"none", cursor:"pointer", position:"relative",
                    transition:"background 0.2s", flexShrink:0,
                  }}
                >
                  <div style={{
                    position:"absolute", top:3,
                    left: prefs[item.key] ? 23 : 3,
                    width:20, height:20, borderRadius:"50%",
                    background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
                    transition:"left 0.2s cubic-bezier(.22,1,.36,1)",
                  }}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────
const FILTER_OPTIONS = ["All", "overdue", "payment", "fraud", "sync", "reminder", "system"];

function FilterTabs({ active, onChange, counts }) {
  const scrollRef = useRef(null);
  return (
    <div ref={scrollRef} style={{
      display:"flex", gap:8, padding:"12px 16px",
      overflowX:"auto", scrollbarWidth:"none",
    }}>
      {FILTER_OPTIONS.map(f => {
        const isActive = active === f;
        const count    = counts[f] || 0;
        const label    = f === "All" ? "All" : TYPE_CONFIG[f]?.label || f;
        return (
          <button key={f} className="filter-chip" onClick={() => onChange(f)} style={{
            background:  isActive ? t.blue : "#fff",
            color:       isActive ? "#fff" : t.muted,
            borderColor: isActive ? t.blue : t.border,
            position:"relative",
          }}>
            {label}
            {count > 0 && !isActive && (
              <span style={{
                marginLeft:5,
                background: f === "overdue" || f === "fraud" ? t.red : t.blue,
                color:"#fff",
                borderRadius:"99px",
                fontSize:9, fontWeight:800,
                padding:"1px 5px",
                verticalAlign:"middle",
              }}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Nav icons ────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"home",     label:"HOME"      },
  { id:"customers",label:"CUSTOMERS" },
  { id:"reports",  label:"REPORTS"   },
  { id:"settings", label:"SETTINGS"  },
];

function NavIcon({ id }) {
  const s = { stroke:"currentColor", strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round" };
  switch(id) {
    case "home":      return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9" {...s}/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" {...s}/></svg>;
    case "customers": return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" {...s}/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" {...s}/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" {...s}/></svg>;
    case "reports":   return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" {...s}/><path d="M8 17v-5M12 17V7M16 17v-3" {...s}/></svg>;
    case "settings":  return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" {...s}/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...s}/></svg>;
    default: return null;
  }
}

function BottomNav({ onNavigate }) {
  return (
    <nav style={{ background:"#fff", borderTop:`1px solid ${t.border}`, display:"flex", zIndex:100 }}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} className="nav-btn" onClick={() => onNavigate?.(item.id)}
          style={{ color: t.muted }}>
          <NavIcon id={item.id}/>{item.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Main Component ───────────────────────────────────────────────
/**
 * NotificationsCentre
 *
 * Props:
 *  - notifications   {Array}  — initial list (defaults to sample)
 *  - onNavigate      {fn}
 *  - onBack          {fn}
 *  - onActionTap     {(action, notif) => void}  — e.g. "Send Reminder", "View Profile"
 */
export default function NotificationsCentre({
  notifications: initialNotifs = INITIAL_NOTIFICATIONS,
  onNavigate   = () => {},
  onBack       = () => {},
  onActionTap  = () => {},
}) {
  const [notifs,      setNotifs]      = useState(initialNotifs);
  const [filter,      setFilter]      = useState("All");
  const [sheet,       setSheet]       = useState(null); // null | "clearAll" | "settings"
  const [shown,       setShown]       = useState(false);
  const [prefs,       setPrefs]       = useState({
    overdue:true, payment:true, fraud:true, sync:true, reminder:true, system:true,
  });

  useEffect(() => {
    const id = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(id);
  }, []);

  // Computed counts for filter badges
  const unreadCounts = FILTER_OPTIONS.reduce((acc, f) => {
    acc[f] = notifs.filter(n => !n.read && (f === "All" || n.type === f)).length;
    return acc;
  }, {});

  const totalUnread = notifs.filter(n => !n.read).length;

  // Filtered notifications
  const filtered = notifs.filter(n => filter === "All" || n.type === filter);

  // Group into Today / Earlier
  const grouped = filtered.reduce((acc, n) => {
    if (!acc[n.group]) acc[n.group] = [];
    acc[n.group].push(n);
    return acc;
  }, {});

  const handleDismiss = useCallback((id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleRead = useCallback((id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const handleClearAll = useCallback(() => {
    setNotifs([]);
    setSheet(null);
  }, []);

  const handleAction = useCallback((actionLabel, notif) => {
    handleRead(notif.id);
    onActionTap(actionLabel, notif);
  }, [handleRead, onActionTap]);

  const handlePrefChange = useCallback((key, val) => {
    setPrefs(prev => ({ ...prev, [key]: val }));
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{
        width:"100%", maxWidth:420, minHeight:"100vh",
        background:t.bg, display:"flex", flexDirection:"column",
        margin:"0 auto", fontFamily:"'Sora',sans-serif",
        opacity: shown ? 1 : 0, transition:"opacity 0.25s ease",
      }}>

        {/* ── Topbar ── */}
        <div style={{
          background:"#fff", padding:"14px 16px",
          display:"flex", alignItems:"center", gap:10,
          borderBottom:`1px solid ${t.border}`,
          position:"sticky", top:0, zIndex:50,
        }}>
          <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", flexShrink:0 }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18, fontWeight:700, color:t.text }}>Notifications</span>
              {totalUnread > 0 && (
                <span style={{
                  background:t.red, color:"#fff",
                  borderRadius:99, fontSize:11, fontWeight:800,
                  padding:"2px 8px", lineHeight:1.4,
                  animation:"pulseRed 2s ease-in-out infinite",
                }}>
                  {totalUnread} new
                </span>
              )}
            </div>
          </div>

          <div style={{ display:"flex", gap:4 }}>
            {totalUnread > 0 && (
              <button className="mark-read-btn" onClick={handleMarkAllRead} style={{ marginRight:4 }}>
                Mark all read
              </button>
            )}
            {/* Settings gear */}
            <button onClick={() => setSheet("settings")} style={{ background:"none", border:"none", cursor:"pointer", padding:6 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" stroke={t.muted} strokeWidth="1.8"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                  stroke={t.muted} strokeWidth="1.8"/>
              </svg>
            </button>
            {/* Trash */}
            {notifs.length > 0 && (
              <button onClick={() => setSheet("clearAll")} style={{ background:"none", border:"none", cursor:"pointer", padding:6 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    stroke={t.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <FilterTabs active={filter} onChange={setFilter} counts={unreadCounts}/>

        {/* ── Content ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 16px 24px" }}>
          {filtered.length === 0 ? (
            <EmptyState filter={filter}/>
          ) : (
            Object.entries(grouped).map(([group, groupNotifs]) => {
              let animOffset = 0;
              // Count cards before this group for stagger
              const prevGroups = Object.keys(grouped);
              const idx = prevGroups.indexOf(group);
              for (let i = 0; i < idx; i++) {
                animOffset += grouped[prevGroups[i]].length;
              }

              return (
                <div key={group} style={{ marginBottom:8 }}>
                  {/* Group header */}
                  <div style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"10px 0 8px",
                  }}>
                    <div style={{ fontSize:11, fontWeight:700, color:t.muted, letterSpacing:"0.07em", textTransform:"uppercase" }}>
                      {group}
                    </div>
                    <div style={{ fontSize:11, color:t.muted }}>
                      {groupNotifs.filter(n => !n.read).length > 0 && (
                        <span style={{ color:t.blue, fontWeight:600 }}>
                          {groupNotifs.filter(n => !n.read).length} unread
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cards */}
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {groupNotifs.map((notif, i) => (
                      <NotifCard
                        key={notif.id}
                        notif={notif}
                        animIndex={animOffset + i}
                        onDismiss={handleDismiss}
                        onRead={handleRead}
                        onAction={(label) => handleAction(label, notif)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* Bottom hint */}
          {filtered.length > 0 && (
            <div style={{ textAlign:"center", padding:"16px 0 4px", fontSize:11, color:t.muted }}>
              Tap a card to mark as read · Hover to dismiss
            </div>
          )}
        </div>

        <BottomNav onNavigate={onNavigate}/>

        {/* ── Sheets ── */}
        {sheet === "clearAll" && (
          <ClearAllSheet
            count={notifs.length}
            onConfirm={handleClearAll}
            onClose={() => setSheet(null)}
          />
        )}

        {sheet === "settings" && (
          <SettingsSheet
            prefs={prefs}
            onChange={handlePrefChange}
            onClose={() => setSheet(null)}
          />
        )}
      </div>
    </>
  );
}