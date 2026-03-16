// HomeDashboard.jsx
// GramSync Merchant App — Home Screen
// Fonts: import 'Sora' + 'JetBrains Mono' in your index.html or global CSS
// Deps: none (pure React + inline styles / CSS-in-JS via <style> tag)

import { useState, useEffect } from "react";

// ─── Design tokens ───────────────────────────────────────────────
const t = {
  blue:      "#2347F5",
  blueMid:   "#3A5BFF",
  bluePale:  "#EEF1FF",
  green:     "#0BAF60",
  greenPale: "#E6F9F0",
  orange:    "#F56A00",
  red:       "#E8304A",
  yellow:    "#F5A623",
  bg:        "#F0F2F8",
  card:      "#FFFFFF",
  text:      "#0D1226",
  muted:     "#7A85A3",
  border:    "#E2E6F3",
};

// ─── Sub-components ───────────────────────────────────────────────

function Avatar({ initials, bg = t.bluePale, color = t.blue, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.33,
      fontFamily: "'Sora', sans-serif",
    }}>
      {initials}
    </div>
  );
}

function Badge({ children, color, bg }) {
  return (
    <span style={{
      display: "inline-block", borderRadius: 6,
      fontSize: 10, fontWeight: 700, padding: "3px 8px",
      letterSpacing: "0.04em", background: bg, color,
      fontFamily: "'Sora', sans-serif",
    }}>
      {children}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: t.card, borderRadius: 14, padding: 14,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Hero Card ────────────────────────────────────────────────────
function HeroCard({ amount = "45,280.00", change = "+5.2%" }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      margin: "16px 16px 12px",
      borderRadius: 20,
      background: `linear-gradient(135deg, #1a38e8 0%, #3a5bff 100%)`,
      color: "#fff",
      padding: "22px 22px 20px",
      position: "relative",
      overflow: "hidden",
      opacity: shown ? 1 : 0,
      transform: shown ? "translateY(0)" : "translateY(12px)",
      transition: "opacity .35s ease, transform .35s ease",
    }}>
      {/* decorative circles */}
      <div style={{ position:"absolute", right:-30, top:-40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.07)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", right:30, bottom:-50, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />

      <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", opacity:0.75, textTransform:"uppercase", marginBottom:6 }}>
        Total Outstanding Credit
      </div>
      <div style={{ fontSize:34, fontWeight:800, fontFamily:"'JetBrains Mono', monospace", marginBottom:8 }}>
        ₹{amount}
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{
          display:"inline-flex", alignItems:"center", gap:4,
          background:"rgba(255,255,255,0.18)", borderRadius:8,
          padding:"3px 10px", fontSize:12, fontWeight:700,
        }}>
          ↑ {change}
        </span>
        <span style={{ fontSize:11, opacity:0.65, display:"flex", alignItems:"center", gap:5 }}>
          <SyncIcon size={13} color="rgba(255,255,255,0.8)" />
          Updated just now
        </span>
      </div>
    </div>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────
function StatsRow({ udharCount = 12, jamaCount = 8 }) {
  return (
    <div style={{ display:"flex", gap:12, margin:"0 16px 12px" }}>
      <StatCard label="UDHAR" labelColor={t.orange} icon="▲" count={udharCount} sub="Credits Today" delay={120} />
      <StatCard label="JAMA"  labelColor={t.green}  icon="▼" count={jamaCount}  sub="Payments Today" delay={200} />
    </div>
  );
}

function StatCard({ label, labelColor, icon, count, sub, delay }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const id = setTimeout(() => setShown(true), delay); return () => clearTimeout(id); }, [delay]);
  return (
    <Card style={{
      flex:1, opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(10px)",
      transition: "opacity .3s ease, transform .3s ease",
    }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:labelColor, marginBottom:4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:t.text, marginBottom:2 }}>{count}</div>
      <div style={{ fontSize:11, color:t.muted }}>{sub}</div>
    </Card>
  );
}

// ─── Sync Health ──────────────────────────────────────────────────
function SyncHealth({ status = "EXCELLENT", message = "Persistent queue is empty. All transactions are synced to cloud." }) {
  const isExcellent = status === "EXCELLENT";
  return (
    <div style={{ margin:"0 16px 16px" }}>
      <Card>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            width:38, height:38, borderRadius:"50%",
            background: isExcellent ? t.greenPale : "#FFF8E5",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            {isExcellent
              ? <CheckIcon size={18} color={t.green} />
              : <WarnIcon size={18} color={t.yellow} />}
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:t.text, display:"flex", alignItems:"center", gap:8 }}>
              Sync Health
              <span style={{ fontSize:11, fontWeight:700, color: isExcellent ? t.green : t.yellow }}>
                {status}
              </span>
            </div>
            <div style={{ fontSize:12, color:t.muted, marginTop:2, lineHeight:1.5 }}>{message}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Recent Transactions ──────────────────────────────────────────
const TRANSACTIONS = [
  { id:1, name:"Rajesh Kumar",  initials:"RK", type:"Udhar", time:"10:45 AM",  amount:"−₹450",   amountColor:t.orange, status:"SYNCED",  statusColor:t.green,  avatarBg:t.bluePale,  avatarColor:t.blue  },
  { id:2, name:"Anita Sharma",  initials:"AS", type:"Jama",  time:"09:12 AM",  amount:"+₹1,200",  amountColor:t.green,  status:"PENDING", statusColor:t.yellow, avatarBg:t.greenPale, avatarColor:t.green },
  { id:3, name:"Vikram Singh",  initials:"VS", type:"Udhar", time:"Yesterday", amount:"−₹2,100",  amountColor:t.orange, status:"SYNCED",  statusColor:t.green,  avatarBg:t.bluePale,  avatarColor:t.blue  },
];

function RecentTransactions({ onViewAll }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"0 16px 10px" }}>
        <div style={{ fontSize:15, fontWeight:700, color:t.text }}>Recent Transactions</div>
        <button onClick={onViewAll} style={{
          background:"none", border:"none", cursor:"pointer",
          fontSize:12, fontWeight:600, color:t.blue,
          fontFamily:"'Sora', sans-serif", padding:0,
        }}>
          View All
        </button>
      </div>
      <div style={{ margin:"0 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {TRANSACTIONS.map((tx, i) => (
          <TxnRow key={tx.id} tx={tx} delay={280 + i * 80} />
        ))}
      </div>
    </div>
  );
}

function TxnRow({ tx, delay }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const id = setTimeout(() => setShown(true), delay); return () => clearTimeout(id); }, [delay]);

  return (
    <Card style={{
      display:"flex", alignItems:"center", gap:12,
      opacity: shown ? 1 : 0, transform: shown ? "translateX(0)" : "translateX(-10px)",
      transition: "opacity .3s ease, transform .3s ease",
      cursor:"pointer",
    }}>
      <Avatar initials={tx.initials} bg={tx.avatarBg} color={tx.avatarColor} size={42} />
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600, color:t.text }}>{tx.name}</div>
        <div style={{ fontSize:11, color:t.muted, marginTop:1 }}>{tx.type} · {tx.time}</div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:14, fontWeight:700, fontFamily:"'JetBrains Mono', monospace", color:tx.amountColor }}>
          {tx.amount}
        </div>
        <div style={{ fontSize:10, fontWeight:600, marginTop:2, color:tx.statusColor }}>
          {tx.status === "SYNCED" ? "✓ " : "⏳ "}{tx.status}
        </div>
      </div>
    </Card>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────
function Topbar({ onNotification }) {
  return (
    <div style={{
      background:"#fff",
      padding:"16px 20px 14px",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      borderBottom:`1px solid ${t.border}`,
      position:"sticky", top:0, zIndex:50,
    }}>
      <div>
        <div style={{ fontSize:17, fontWeight:700, color:t.text }}>GramSync Merchant</div>
        <div style={{ fontSize:10, color:t.muted, fontWeight:500, letterSpacing:"0.06em", textTransform:"uppercase", marginTop:1 }}>
          Store Dashboard
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onNotification} style={{ background:"none", border:"none", cursor:"pointer", position:"relative", padding:2 }}>
          <BellIcon size={22} color={t.text} />
          <span style={{
            position:"absolute", top:0, right:0, width:8, height:8,
            background:t.red, borderRadius:"50%", border:"2px solid #fff",
          }} />
        </button>
        <Avatar initials="GS" bg={t.bluePale} color={t.blue} size={36} />
      </div>
    </div>
  );
}

// ─── FAB ──────────────────────────────────────────────────────────
function FAB({ onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onClick={onClick}
      style={{
        position:"fixed", bottom:80,
        right: "max(16px, calc(50% - 194px))",
        width:52, height:52, borderRadius:"50%",
        background:t.blue, color:"#fff", border:"none",
        fontSize:26, cursor:"pointer",
        boxShadow:"0 4px 16px rgba(35,71,245,0.42)",
        display:"flex", alignItems:"center", justifyContent:"center",
        transform: pressed ? "scale(0.92)" : "scale(1)",
        transition:"transform 0.12s ease",
        zIndex: 60,
      }}
    >
      +
    </button>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"home",      label:"HOME",      icon:"home"      },
  { id:"customers", label:"CUSTOMERS", icon:"customers" },
  { id:"reports",   label:"REPORTS",   icon:"reports"   },
  { id:"settings",  label:"SETTINGS",  icon:"settings"  },
];

function BottomNav({ active = "home", onNavigate }) {
  return (
    <nav style={{
      position:"sticky", bottom:0,
      background:"#fff", borderTop:`1px solid ${t.border}`,
      display:"flex", zIndex:100,
    }}>
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate?.(item.id)}
          style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            padding:"10px 0 12px", gap:4, cursor:"pointer",
            border:"none", background:"none",
            color: active === item.id ? t.blue : t.muted,
            fontFamily:"'Sora', sans-serif", fontSize:10, fontWeight:500,
            transition:"color 0.15s",
          }}
        >
          <NavIcon name={item.icon} size={22} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Icon Components ──────────────────────────────────────────────
function BellIcon({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function CheckIcon({ size = 18, color = t.green }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function WarnIcon({ size = 18, color = t.yellow }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function SyncIcon({ size = 14, color = t.muted }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
      <path d="M4 12a8 8 0 0116 0" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 12a8 8 0 01-16 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4"/>
    </svg>
  );
}
function NavIcon({ name, size = 22 }) {
  const s = { stroke:"currentColor", strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round" };
  switch (name) {
    case "home": return (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <path d="M3 12L12 3l9 9" {...s}/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" {...s}/>
      </svg>
    );
    case "customers": return (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" {...s}/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" {...s}/>
        <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" {...s}/>
      </svg>
    );
    case "reports": return (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" {...s}/>
        <path d="M8 17v-5M12 17V7M16 17v-3" {...s}/>
      </svg>
    );
    case "settings": return (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" {...s}/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...s}/>
      </svg>
    );
    default: return null;
  }
}

// ─── Injected global styles ───────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: #F0F2F8; font-family: 'Sora', sans-serif; }
  ::-webkit-scrollbar { display: none; }
`;

// ─── Main Component ───────────────────────────────────────────────

/**
 * HomeDashboard
 *
 * Props:
 *  - totalCredit    {string}   e.g. "45,280.00"
 *  - creditChange   {string}   e.g. "+5.2%"
 *  - udharCount     {number}
 *  - jamaCount      {number}
 *  - syncStatus     {"EXCELLENT"|"WARNING"|"OFFLINE"}
 *  - syncMessage    {string}
 *  - transactions   {Array<{ id, name, initials, type, time, amount, amountColor, status, statusColor, avatarBg, avatarColor }>}
 *  - onNavigate     {(screenId: string) => void}
 *  - onAddTransaction {() => void}
 *  - onViewAll      {() => void}
 *  - onNotification {() => void}
 */
export default function HomeDashboard({
  totalCredit    = "45,280.00",
  creditChange   = "+5.2%",
  udharCount     = 12,
  jamaCount      = 8,
  syncStatus     = "EXCELLENT",
  syncMessage    = "Persistent queue is empty. All transactions are synced to cloud.",
  onNavigate     = () => {},
  onAddTransaction = () => {},
  onViewAll      = () => {},
  onNotification = () => {},
}) {
  return (
    <>
      {/* Inject global styles once */}
      <style>{GLOBAL_CSS}</style>

      <div style={{
        width:"100%", maxWidth:420, minHeight:"100vh",
        background:t.bg, display:"flex", flexDirection:"column",
        margin:"0 auto", position:"relative",
        fontFamily:"'Sora', sans-serif",
      }}>
        <Topbar onNotification={onNotification} />

        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:"auto", paddingBottom:20 }}>
          <HeroCard amount={totalCredit} change={creditChange} />
          <StatsRow udharCount={udharCount} jamaCount={jamaCount} />
          <SyncHealth status={syncStatus} message={syncMessage} />
          <RecentTransactions onViewAll={onViewAll} />
          {/* Bottom spacer so FAB doesn't cover last row */}
          <div style={{ height:72 }} />
        </div>

        <FAB onClick={onAddTransaction} />
        <BottomNav active="home" onNavigate={onNavigate} />
      </div>
    </>
  );
}