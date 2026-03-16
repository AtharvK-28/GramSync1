// CustomerProfile.jsx
// GramSync Merchant App â€” Customer Profile & Ledger Screen
// Features: balance hero, score ring, full txn timeline, filters,
//           send reminder sheet, edit note, share receipt, call shortcut
// Deps: pure React, no external libraries

import { useState, useEffect, useCallback, useRef } from "react";

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

// â”€â”€â”€ Sample data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DEFAULT_CUSTOMER = {
  id: "GS-9982",
  name: "Rajesh Kumar",
  phone: "+91 98765 43210",
  initials: "RK",
  since: "July 2023",
  address: "12, Gandhi Nagar, Nashik",
  gramScore: 720,
  maxScore: 900,
  status: "safe",
  creditLimit: 5000,
  totalUdhar: 3200,
  totalJama: 1950,
  balance: 1250,
  balanceType: "udhar",
  lastActivity: "Today, 10:45 AM",
};

const DEFAULT_TRANSACTIONS = [
  { id: 1,  date: "Today",          time: "10:45 AM", type: "udhar", amount: 500,  label: "Grocery Items",          synced: true,  note: "" },
  { id: 2,  date: "Today",          time: "08:20 AM", type: "jama",  amount: 200,  label: "Payment Received",        synced: true,  note: "Cash" },
  { id: 3,  date: "Yesterday",      time: "06:10 PM", type: "udhar", amount: 950,  label: "Bulk Grain Purchase",     synced: false, note: "Pending sync" },
  { id: 4,  date: "12 Oct",         time: "11:30 AM", type: "jama",  amount: 750,  label: "Partial Payment",         synced: true,  note: "" },
  { id: 5,  date: "10 Oct",         time: "03:15 PM", type: "udhar", amount: 400,  label: "Household Items",         synced: true,  note: "" },
  { id: 6,  date: "08 Oct",         time: "09:00 AM", type: "jama",  amount: 1000, label: "Full Settlement",         synced: true,  note: "UPI transfer" },
  { id: 7,  date: "05 Oct",         time: "05:45 PM", type: "udhar", amount: 650,  label: "Vegetables + Pulses",     synced: true,  note: "" },
  { id: 8,  date: "01 Oct",         time: "12:00 PM", type: "udhar", amount: 1000, label: "Old Balance Carry Fwd",   synced: true,  note: "Opening balance" },
];

const SCORE_BREAKDOWN = [
  { label: "Repayment rate",     score: 72, max: 100 },
  { label: "Payment frequency",  score: 80, max: 100 },
  { label: "Credit history",     score: 65, max: 100 },
  { label: "Balance vs limit",   score: 58, max: 100 },
];

// â”€â”€â”€ Global CSS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  body { background:#F0F2F8; font-family:'Sora',sans-serif; }
  ::-webkit-scrollbar { display:none; }

  @keyframes fadeSlideUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes stagger {
    from { opacity:0; transform:translateX(-8px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes scoreRing {
    from { stroke-dashoffset: var(--full); }
    to   { stroke-dashoffset: var(--target); }
  }
  @keyframes balanceCount {
    from { opacity:0; transform:scale(0.85); }
    to   { opacity:1; transform:scale(1); }
  }

  .txn-row {
    display:flex; align-items:center; gap:12px;
    padding:13px 16px;
    background:#fff; border-radius:14px;
    box-shadow:0 1px 3px rgba(0,0,0,0.04);
    cursor:pointer;
    transition:box-shadow 0.15s, transform 0.12s;
  }
  .txn-row:hover { box-shadow:0 3px 14px rgba(0,0,0,0.08); transform:translateY(-1px); }
  .txn-row:active { transform:scale(0.98); }

  .filter-chip {
    border:1.5px solid; border-radius:99px;
    padding:6px 14px; font-size:12px; font-weight:600;
    cursor:pointer; white-space:nowrap;
    transition:background 0.15s, color 0.15s, border-color 0.15s;
    font-family:'Sora',sans-serif; background:none;
  }

  .action-fab {
    display:flex; flex-direction:column; align-items:center; gap:6px;
    cursor:pointer; background:none; border:none;
    font-family:'Sora',sans-serif; font-size:11px; font-weight:600;
    transition:transform 0.12s;
  }
  .action-fab:active { transform:scale(0.92); }
  .action-fab-circle {
    width:52px; height:52px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    transition:filter 0.12s;
  }
  .action-fab:hover .action-fab-circle { filter:brightness(1.08); }

  .sheet-overlay {
    position:fixed; inset:0; z-index:200;
    background:rgba(13,18,38,0.55);
    display:flex; align-items:flex-end;
    animation:fadeIn 0.18s ease;
  }
  .sheet-body {
    background:#fff; border-radius:22px 22px 0 0;
    width:100%; padding:24px 20px 36px;
    animation:fadeSlideUp 0.26s cubic-bezier(.22,1,.36,1);
    box-shadow:0 -8px 40px rgba(0,0,0,0.15);
    max-height:85vh; overflow-y:auto;
  }
  .sheet-handle { width:38px; height:4px; border-radius:99px; background:#E2E6F3; margin:0 auto 20px; }

  .primary-btn {
    width:100%; padding:16px; border-radius:14px; border:none;
    font-family:'Sora',sans-serif; font-weight:800; font-size:15px;
    cursor:pointer; transition:transform 0.1s, filter 0.1s;
  }
  .primary-btn:hover  { filter:brightness(1.06); }
  .primary-btn:active { transform:scale(0.97); }

  .nav-btn {
    flex:1; display:flex; flex-direction:column; align-items:center;
    padding:10px 0 12px; gap:4px; cursor:pointer;
    border:none; background:none;
    font-family:'Sora',sans-serif; font-size:10px; font-weight:500;
    transition:color 0.15s;
  }
`;

// â”€â”€â”€ Score Ring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScoreRing({ score, max, size = 80, animate = false }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / max) * circ;
  const offset = circ - fill;
  const pct = Math.round((score / max) * 100);
  const color = pct >= 70 ? t.green : pct >= 45 ? t.yellow : t.red;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.border} strokeWidth={6}/>
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={animate ? offset : offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={animate ? {
          strokeDashoffset: offset,
          transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1) 0.3s",
        } : {}}
      />
      <text x={size/2} y={size/2 - 5} textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily:"'JetBrains Mono',monospace", fontSize: size*0.22, fontWeight:800, fill: t.text }}>
        {score}
      </text>
      <text x={size/2} y={size/2 + 14} textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily:"'Sora',sans-serif", fontSize: size*0.12, fontWeight:500, fill: t.muted }}>
        /{max}
      </text>
    </svg>
  );
}

// â”€â”€â”€ Score Breakdown Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScoreBar({ label, score, max, delay = 0, animate }) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setFilled(animate), delay);
    return () => clearTimeout(id);
  }, [animate, delay]);
  const pct = Math.round((score / max) * 100);
  const color = pct >= 70 ? t.green : pct >= 45 ? t.yellow : t.red;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <span style={{ fontSize:12, color:t.text, fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace" }}>{score}/{max}</span>
      </div>
      <div style={{ height:5, background:t.border, borderRadius:99, overflow:"hidden" }}>
        <div style={{
          height:"100%", background:color, borderRadius:99,
          width: filled ? `${pct}%` : "0%",
          transition:"width 0.8s cubic-bezier(.22,1,.36,1)",
        }}/>
      </div>
    </div>
  );
}

// â”€â”€â”€ Transaction Icon â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TxnIcon({ type, synced }) {
  const bg    = type === "udhar" ? t.orangePale : t.greenPale;
  const color = type === "udhar" ? t.orange     : t.green;
  return (
    <div style={{
      width:42, height:42, borderRadius:12, background:bg, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      position:"relative",
    }}>
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        {type === "udhar"
          ? <path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M12 5v14M19 12l-7 7-7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>}
      </svg>
      {!synced && (
        <div style={{
          position:"absolute", top:-3, right:-3,
          width:12, height:12, borderRadius:"50%",
          background:t.yellow, border:"2px solid #fff",
        }}/>
      )}
    </div>
  );
}

// â”€â”€â”€ Reminder Sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReminderSheet({ customer, onSend, onClose }) {
  const [channel, setChannel] = useState("whatsapp");
  const [msg, setMsg] = useState(
    `Namaste ${customer.name}! Aapka GramSync balance ₹${customer.balance.toLocaleString("en-IN")} hai. Kripya jaldi payment karein. Dhanyawad! ðŸ™`
  );
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-body" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{ fontSize:16, fontWeight:700, color:t.text, marginBottom:4 }}>Send Payment Reminder</div>
        <div style={{ fontSize:12, color:t.muted, marginBottom:18 }}>
          to <strong style={{ color:t.text }}>{customer.name}</strong> â€” Balance: <strong style={{ color:t.orange }}>₹{customer.balance.toLocaleString("en-IN")}</strong>
        </div>

        {/* Channel selector */}
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          {[
            { id:"whatsapp", label:"WhatsApp", color:"#25D366" },
            { id:"sms",      label:"SMS",      color:t.blue    },
          ].map(ch => (
            <button key={ch.id} onClick={() => setChannel(ch.id)} style={{
              flex:1, padding:"10px", borderRadius:12,
              border:`2px solid ${channel === ch.id ? ch.color : t.border}`,
              background: channel === ch.id ? (ch.id === "whatsapp" ? "#F0FDF4" : t.bluePale) : "#fff",
              fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:700,
              color: channel === ch.id ? (ch.id === "whatsapp" ? "#16A34A" : t.blue) : t.muted,
              cursor:"pointer", transition:"all 0.15s",
            }}>
              {ch.label}
            </button>
          ))}
        </div>

        {/* Message editor */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:t.muted, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>Message</div>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4}
            style={{
              width:"100%", padding:"12px 14px", borderRadius:12,
              border:`1.5px solid ${t.border}`, fontFamily:"'Sora',sans-serif",
              fontSize:13, color:t.text, background:t.bg, resize:"none", outline:"none",
              lineHeight:1.6,
            }}/>
        </div>

        {/* Quick templates */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:11, fontWeight:700, color:t.muted, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>Quick Templates</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              "Gentle reminder: Your balance is due. Please pay when convenient.",
              "Last reminder: Please clear your outstanding amount to continue credit.",
            ].map((tmpl, i) => (
              <button key={i} onClick={() => setMsg(tmpl)} style={{
                padding:"10px 12px", borderRadius:10,
                border:`1px solid ${t.border}`, background:"#fff",
                fontFamily:"'Sora',sans-serif", fontSize:12, color:t.muted,
                cursor:"pointer", textAlign:"left", transition:"background 0.12s",
              }}>{tmpl}</button>
            ))}
          </div>
        </div>

        <button className="primary-btn" onClick={() => onSend(channel, msg)}
          style={{
            background: channel === "whatsapp" ? "#25D366" : t.blue,
            color:"#fff",
            boxShadow: channel === "whatsapp" ? "0 4px 16px rgba(37,211,102,0.3)" : "0 4px 16px rgba(35,71,245,0.3)",
          }}>
          Send via {channel === "whatsapp" ? "WhatsApp" : "SMS"}
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Transaction Detail Sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TxnDetailSheet({ txn, onClose }) {
  if (!txn) return null;
  const isUdhar = txn.type === "udhar";
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-body" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>

        {/* Amount hero */}
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{
            width:64, height:64, borderRadius:"50%",
            background: isUdhar ? t.orangePale : t.greenPale,
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0 auto 12px",
          }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              {isUdhar
                ? <path d="M12 19V5M5 12l7-7 7 7" stroke={isUdhar ? t.orange : t.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M12 5v14M19 12l-7 7-7-7" stroke={t.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}
            </svg>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color: isUdhar ? t.orange : t.green, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>
            {isUdhar ? "Credit Given (Udhar)" : "Payment Received (Jama)"}
          </div>
          <div style={{ fontSize:36, fontWeight:800, color:t.text, fontFamily:"'JetBrains Mono',monospace" }}>
            ₹{txn.amount.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize:12, color:t.muted, marginTop:4 }}>{txn.date} · {txn.time}</div>
        </div>

        {/* Details */}
        <div style={{ background:t.bg, borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
          {[
            { label:"Description", value:txn.label },
            { label:"Transaction ID", value:`#TXN-${10000 + txn.id}` },
            { label:"Sync Status", value: txn.synced ? "âœ“ Synced to Cloud" : "â³ Pending Sync", valueColor: txn.synced ? t.green : t.yellow },
            ...(txn.note ? [{ label:"Note", value:txn.note }] : []),
          ].map((row, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom: i < 3 ? `1px solid ${t.border}` : "none" }}>
              <span style={{ fontSize:12, color:t.muted }}>{row.label}</span>
              <span style={{ fontSize:12, fontWeight:600, color: row.valueColor || t.text, fontFamily: row.label === "Transaction ID" ? "'JetBrains Mono',monospace" : "'Sora',sans-serif" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:10 }}>
          <button className="primary-btn" style={{ background:t.bluePale, color:t.blue, fontSize:13 }}>
            Share Receipt
          </button>
          <button className="primary-btn" style={{ background:t.redPale, color:t.red, fontSize:13, flex:"0 0 auto", width:"auto", padding:"16px 20px" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Score Sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScoreSheet({ customer, onClose }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { setTimeout(() => setAnimate(true), 100); }, []);
  const pct = Math.round((customer.gramScore / customer.maxScore) * 100);
  const statusLabel = pct >= 70 ? "SAFE TO LEND" : pct >= 45 ? "LEND WITH CAUTION" : "HIGH RISK";
  const statusColor = pct >= 70 ? t.green : pct >= 45 ? t.yellow : t.red;
  const statusBg    = pct >= 70 ? t.greenPale : pct >= 45 ? t.yellowPale : t.redPale;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-body" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <ScoreRing score={customer.gramScore} max={customer.maxScore} size={100} animate={animate}/>
          <div style={{ fontSize:17, fontWeight:800, color:t.text, marginTop:10 }}>{customer.name}</div>
          <span style={{
            display:"inline-block", marginTop:6,
            background:statusBg, color:statusColor,
            borderRadius:8, padding:"4px 12px",
            fontSize:11, fontWeight:700, letterSpacing:"0.05em",
          }}>{statusLabel}</span>
          <div style={{ fontSize:12, color:t.muted, marginTop:8, lineHeight:1.6 }}>
            Balance growing. Suggest partial repayment before giving more credit.
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:t.blue, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:14 }}>Score Breakdown</div>
          {SCORE_BREAKDOWN.map((b, i) => (
            <ScoreBar key={i} label={b.label} score={b.score} max={b.max} delay={i * 100} animate={animate}/>
          ))}
        </div>

        <div style={{ background:t.bluePale, borderRadius:12, padding:"12px 14px", fontSize:11, color:t.blue, lineHeight:1.6 }}>
          â„¹ Score reflects payment behaviour across the GramSync merchant network. Range: 300 (poor) â€“ 900 (excellent).
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Balance Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BalanceHero({ customer }) {
  const isUdhar = customer.balanceType === "udhar";
  return (
    <div style={{
      background: isUdhar
        ? `linear-gradient(135deg, #1a38e8 0%, #3a5bff 100%)`
        : `linear-gradient(135deg, #098F4E 0%, #0BAF60 100%)`,
      margin:"0", padding:"20px 20px 24px",
      color:"#fff", position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", right:-20, top:-30, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }}/>
      <div style={{ position:"absolute", right:40, bottom:-40, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, opacity:0.75, letterSpacing:"0.07em", textTransform:"uppercase" }}>Total Balance</div>
          <div style={{ fontSize:32, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", marginTop:2, animation:"balanceCount 0.4s ease" }}>
            ₹{customer.balance.toLocaleString("en-IN")}.00
          </div>
        </div>
        <div style={{
          background:"rgba(255,255,255,0.18)", borderRadius:12,
          padding:"6px 14px", fontSize:12, fontWeight:700,
        }}>
          {isUdhar ? "UDHAR (YOU OWE)" : "JAMA (THEY OWE)"}
        </div>
      </div>

      {/* Mini stats */}
      <div style={{ display:"flex", gap:10 }}>
        {[
          { label:"Total Udhar", value:`₹${customer.totalUdhar.toLocaleString("en-IN")}`, color:"rgba(255,255,255,0.9)" },
          { label:"Total Jama",  value:`₹${customer.totalJama.toLocaleString("en-IN")}`,  color:"rgba(255,255,255,0.9)" },
          { label:"Credit Limit",value:`₹${customer.creditLimit.toLocaleString("en-IN")}`,color:"rgba(255,255,255,0.7)" },
        ].map((s, i) => (
          <div key={i} style={{
            flex:1, background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"8px 10px",
          }}>
            <div style={{ fontSize:9, opacity:0.7, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3 }}>{s.label}</div>
            <div style={{ fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:14, fontSize:11, opacity:0.65, display:"flex", alignItems:"center", gap:5 }}>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
          <path d="M4 12a8 8 0 0116 0" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          <path d="M20 12a8 8 0 01-16 0" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        All transactions synced to cloud
      </div>
    </div>
  );
}

// â”€â”€â”€ Quick Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function QuickActions({ customer, onCredit, onPayment, onReminder, onScore }) {
  const actions = [
    { label:"Give Credit", icon:"credit",   color:t.orange, bg:t.orangePale, onClick:onCredit  },
    { label:"Accept Pymt", icon:"payment",  color:t.green,  bg:t.greenPale,  onClick:onPayment },
    { label:"Reminder",    icon:"reminder", color:t.blue,   bg:t.bluePale,   onClick:onReminder},
    { label:"Gram Score",  icon:"score",    color:"#7C3AED", bg:"#F3EEFF",   onClick:onScore   },
  ];
  return (
    <div style={{ display:"flex", gap:8, padding:"16px", background:"#fff", borderBottom:`1px solid ${t.border}` }}>
      {actions.map((a, i) => (
        <button key={i} className="action-fab" onClick={a.onClick} style={{ flex:1, color:a.color }}>
          <div className="action-fab-circle" style={{ background:a.bg }}>
            {a.icon === "credit"   && <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke={a.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            {a.icon === "payment"  && <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke={a.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            {a.icon === "reminder" && <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke={a.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            {a.icon === "score"    && <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke={a.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          {a.label}
        </button>
      ))}
    </div>
  );
}

// â”€â”€â”€ Filter Chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FilterChips({ active, onChange }) {
  const chips = ["All", "Udhar", "Jama", "Pending"];
  return (
    <div style={{ display:"flex", gap:8, padding:"14px 16px 10px", overflowX:"auto", scrollbarWidth:"none" }}>
      {chips.map(chip => (
        <button key={chip} className="filter-chip" onClick={() => onChange(chip)} style={{
          background: active === chip ? t.blue : "#fff",
          color:      active === chip ? "#fff" : t.muted,
          borderColor:active === chip ? t.blue : t.border,
        }}>{chip}</button>
      ))}
    </div>
  );
}

// â”€â”€â”€ Transaction List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TransactionList({ transactions, filter, onTxnPress }) {
  const filtered = transactions.filter(tx => {
    if (filter === "All")     return true;
    if (filter === "Udhar")   return tx.type === "udhar";
    if (filter === "Jama")    return tx.type === "jama";
    if (filter === "Pending") return !tx.synced;
    return true;
  });

  // Group by date
  const groups = filtered.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  return (
    <div style={{ padding:"0 16px calc(100px + env(safe-area-inset-bottom))" }}>
      {Object.entries(groups).map(([date, txns]) => (
        <div key={date} style={{ marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:t.muted, letterSpacing:"0.06em", textTransform:"uppercase", padding:"10px 0 8px" }}>
            {date}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {txns.map((tx, i) => {
              const isUdhar = tx.type === "udhar";
              return (
                <div key={tx.id} className="txn-row"
                  style={{ animationDelay:`${i * 50}ms` }}
                  onClick={() => onTxnPress(tx)}>
                  <TxnIcon type={tx.type} synced={tx.synced}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:t.text }}>{tx.label}</div>
                    <div style={{ fontSize:11, color:t.muted, marginTop:1 }}>{tx.time}{tx.note ? ` · ${tx.note}` : ""}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:14, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color: isUdhar ? t.orange : t.green }}>
                      {isUdhar ? "âˆ’" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize:10, fontWeight:600, color: tx.synced ? t.green : t.yellow, marginTop:2 }}>
                      {tx.synced ? "âœ“ SYNCED" : "â³ PENDING"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 0", color:t.muted, fontSize:13 }}>
          No transactions found
        </div>
      )}
      <div style={{ textAlign:"center", padding:"16px 0 0", fontSize:11, color:t.muted }}>
        Showing last 30 days of transactions
      </div>
    </div>
  );
}

// â”€â”€â”€ Topbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Topbar({ customer, onBack, onCall, onDownload }) {
  return (
    <div style={{
      background:"#fff", padding:"14px 16px",
      display:"flex", alignItems:"center", gap:12,
      borderBottom:`1px solid ${t.border}`,
      position:"sticky", top:0, zIndex:50,
    }}>
      <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", flexShrink:0 }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:16, fontWeight:700, color:t.text }}>{customer.name}</div>
        <div style={{ fontSize:11, color:t.muted }}>Customer since {customer.since}</div>
      </div>
      <button onClick={onCall} style={{ background:"none", border:"none", cursor:"pointer", padding:6 }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.86 12 19.79 19.79 0 01.77 3.38 2 2 0 012.76 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.72 6.72l1.08-1.08a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
            stroke={t.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button onClick={onDownload} style={{ background:"none", border:"none", cursor:"pointer", padding:6 }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
            stroke={t.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

// â”€â”€â”€ Bottom action bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BottomBar({ onCredit, onPayment }) {
  return (
    <div style={{
      position:"sticky", bottom:0, background:"#fff",
      borderTop:`1px solid ${t.border}`,
      padding:"12px 16px calc(16px + env(safe-area-inset-bottom))",
      display:"flex", gap:12,
    }}>
      <button className="primary-btn" onClick={onCredit}
        style={{ background:t.red, color:"#fff", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.8"/>
          <path d="M8 12h8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
        Give Credit
      </button>
      <button className="primary-btn" onClick={onPayment}
        style={{ background:t.green, color:"#fff", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.8"/>
          <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
        Accept Payment
      </button>
    </div>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/**
 * CustomerProfile
 * Props:
 *  - customer      {object}   defaults to sample data
 *  - transactions  {array}    defaults to sample data
 *  - onBack        {fn}
 *  - onNavigate    {fn}
 *  - onCredit      {(customer) => void}   â€” navigate to keypad with udhar mode
 *  - onPayment     {(customer) => void}   â€” navigate to keypad with jama mode
 */
export default function CustomerProfile({
  customer     = DEFAULT_CUSTOMER,
  transactions = DEFAULT_TRANSACTIONS,
  onBack       = () => {},
  onNavigate   = () => {},
  onCredit     = () => {},
  onPayment    = () => {},
}) {
  const resolvedCustomer = { ...DEFAULT_CUSTOMER, ...customer };
  const [filter,   setFilter]   = useState("All");
  const [sheet,    setSheet]    = useState(null); // null | "reminder" | "score" | txn object
  const [shown,    setShown]    = useState(false);

  useEffect(() => { const id = setTimeout(() => setShown(true), 60); return () => clearTimeout(id); }, []);

  const handleSendReminder = useCallback((channel, msg) => {
    setSheet(null);
    alert(`âœ“ Reminder sent via ${channel}`);
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{
        width:"100%", maxWidth:420, minHeight:"100dvh",
        background:t.bg, display:"flex", flexDirection:"column",
        margin:"0 auto", fontFamily:"'Sora',sans-serif",
        opacity: shown ? 1 : 0, transition:"opacity 0.25s ease",
      }}>
        <Topbar
          customer={resolvedCustomer}
          onBack={onBack}
          onCall={() => window.open(`tel:${resolvedCustomer.phone}`)}
          onDownload={() => alert("Downloading PDF statementâ€¦")}
        />

        <div style={{ flex:1, overflowY:"auto" }}>
          <BalanceHero customer={resolvedCustomer}/>
          <QuickActions
            customer={resolvedCustomer}
            onCredit={() => onCredit(resolvedCustomer)}
            onPayment={() => onPayment(resolvedCustomer)}
            onReminder={() => setSheet("reminder")}
            onScore={() => setSheet("score")}
          />
          <div style={{ background:"#fff" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px 0" }}>
              <div style={{ fontSize:15, fontWeight:700, color:t.text }}>Transaction History</div>
              <button style={{
                background:"none", border:"none", cursor:"pointer",
                fontSize:12, fontWeight:600, color:t.blue,
                fontFamily:"'Sora',sans-serif",
              }}>Download PDF</button>
            </div>
            <FilterChips active={filter} onChange={setFilter}/>
          </div>
          <TransactionList
            transactions={transactions}
            filter={filter}
            onTxnPress={tx => setSheet(tx)}
          />
        </div>

        <BottomBar
          onCredit={() => onCredit(resolvedCustomer)}
          onPayment={() => onPayment(resolvedCustomer)}
        />

        {/* Sheets */}
        {sheet === "reminder" && (
          <ReminderSheet customer={resolvedCustomer} onSend={handleSendReminder} onClose={() => setSheet(null)}/>
        )}
        {sheet === "score" && (
          <ScoreSheet customer={resolvedCustomer} onClose={() => setSheet(null)}/>
        )}
        {sheet && typeof sheet === "object" && (
          <TxnDetailSheet txn={sheet} onClose={() => setSheet(null)}/>
        )}
      </div>
    </>
  );
}







