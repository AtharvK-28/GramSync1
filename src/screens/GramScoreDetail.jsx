// GramScoreDetail.jsx
// GramSync Merchant App — Gram Score Detail Screen
//
// Features:
//   • Animated SVG score ring (arc draws itself on mount, spring easing)
//   • Colour-reactive ring & hero: green ≥70%, amber 45–69%, red <45%
//   • Lending verdict badge with contextual advice copy
//   • 4-factor breakdown with animated fill bars + per-factor advice
//   • Network comparison — "Better than X% of customers in your area"
//   • Score history sparkline (SVG, 6-month trend)
//   • What affects the score — expandable explainer accordion
//   • Quick actions: Give Credit / Send Reminder / View Profile
//   • Share score card sheet
//   • Fully reactive — pass any customer + score object
//
// Deps: pure React, no external libraries

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Design tokens ────────────────────────────────────────────────
const tk = {
  blue:        "#2347F5",
  blueMid:     "#3A5BFF",
  bluePale:    "#EEF1FF",
  green:       "#0BAF60",
  greenPale:   "#E6F9F0",
  greenDark:   "#098F4E",
  amber:       "#D97706",
  amberPale:   "#FFFBEB",
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

// ─── Score config ─────────────────────────────────────────────────
function scoreConfig(score, max = 900) {
  const pct = (score / max) * 100;
  if (pct >= 70) return {
    grade:      "A",
    label:      "SAFE TO LEND",
    color:      tk.green,
    colorDark:  tk.greenDark,
    pale:       tk.greenPale,
    advice:     "This customer has a strong repayment history. You can extend credit confidently up to their limit.",
    ringGlow:   "rgba(11,175,96,0.25)",
  };
  if (pct >= 45) return {
    grade:      "B",
    label:      "LEND WITH CAUTION",
    color:      tk.amber,
    colorDark:  "#B45309",
    pale:       tk.amberPale,
    advice:     "Balance is growing. Suggest partial repayment before extending more credit. Monitor closely.",
    ringGlow:   "rgba(217,119,6,0.25)",
  };
  return {
    grade:      "C",
    label:      "HIGH RISK",
    color:      tk.red,
    colorDark:  "#B91C1C",
    pale:       tk.redPale,
    advice:     "Multiple missed payments. Hold further credit until existing balance is substantially cleared.",
    ringGlow:   "rgba(232,48,74,0.25)",
  };
}

// ─── Factor definitions ───────────────────────────────────────────
const FACTOR_META = {
  repayment:  { label:"Repayment rate",      icon:"↩", tip:"Percentage of credits that have been paid back on time." },
  frequency:  { label:"Payment frequency",   icon:"⏱", tip:"How regularly the customer makes payments, even partial ones." },
  history:    { label:"Credit history",      icon:"📅", tip:"Length and depth of the customer's borrowing relationship with your store." },
  balance:    { label:"Balance vs limit",    icon:"⚖", tip:"How close their current balance is to their credit ceiling." },
};

function factorAdvice(factor, score) {
  const pct = score;
  if (factor === "repayment")  return pct >= 70 ? "Paying reliably — keep extending credit." : pct >= 45 ? "Some late payments — ask for smaller, more frequent payments." : "Often misses payments. Require partial payment before next credit.";
  if (factor === "frequency")  return pct >= 70 ? "Regular payer — healthy pattern." : pct >= 45 ? "Irregular payment pattern. Set a weekly reminder." : "Rarely pays. Consider stopping credit until balance clears.";
  if (factor === "history")    return pct >= 70 ? "Long relationship — trust is earned." : pct >= 45 ? "Still building history — normal for newer customers." : "Short or thin history. Start with very small credit amounts.";
  if (factor === "balance")    return pct >= 70 ? "Well within limit — healthy buffer." : pct >= 45 ? "Getting close to the limit. Suggest a payment before more credit." : "At or over limit. Do not extend more credit until balance drops.";
  return "";
}

// ─── Sample data ──────────────────────────────────────────────────
const DEFAULT_CUSTOMER = {
  name:         "Mahesh Khatri",
  phone:        "+91 91100 22334",
  initials:     "MK",
  id:           "GS-9910",
  memberSince:  "Mar 2023",
  balance:      3800,
  creditLimit:  5000,
};

const DEFAULT_SCORE_DATA = {
  score:   620,
  max:     900,
  updated: "2 hours ago",
  factors: {
    repayment: 60,
    frequency: 70,
    history:   55,
    balance:   58,
  },
  networkPercentile: 54,  // better than 54% in area
  history: [480, 510, 545, 590, 605, 620],  // 6-month sparkline
  historyLabels: ["May","Jun","Jul","Aug","Sep","Oct"],
};

// ─── CSS ──────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  body { background:#F0F2F8; font-family:'Sora',sans-serif; }
  ::-webkit-scrollbar { display:none; }

  @keyframes fadeSlideUp {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn {
    0%   { transform:scale(0.82); opacity:0; }
    70%  { transform:scale(1.04); opacity:1; }
    100% { transform:scale(1); opacity:1; }
  }
  @keyframes countUp {
    from { opacity:0; transform:translateY(8px) scale(0.9); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes barFill {
    from { width:0%; }
    to   { width:var(--target); }
  }
  @keyframes sparkDraw {
    from { stroke-dashoffset: var(--len); }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes ringDraw {
    from { stroke-dashoffset: var(--circumference); }
    to   { stroke-dashoffset: var(--target-offset); }
  }
  @keyframes glowPulse {
    0%,100% { opacity:0.5; transform:scale(1); }
    50%      { opacity:1;   transform:scale(1.06); }
  }
  @keyframes gradePop {
    0%   { transform:scale(0) rotate(-20deg); opacity:0; }
    65%  { transform:scale(1.18) rotate(4deg); opacity:1; }
    100% { transform:scale(1) rotate(0deg); opacity:1; }
  }

  .factor-bar-bg {
    height:8px; background:#E2E6F3; border-radius:99px; overflow:hidden;
    position:relative;
  }
  .factor-bar-fill {
    height:100%; border-radius:99px;
    animation: barFill 0.9s cubic-bezier(.22,1,.36,1) var(--delay, 0s) both;
    width: var(--target);
  }

  .factor-card {
    background:#fff; border-radius:16px; padding:16px;
    box-shadow:0 1px 4px rgba(0,0,0,0.05);
    cursor:pointer;
    transition:box-shadow 0.15s, transform 0.12s;
  }
  .factor-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.08); }
  .factor-card:active { transform:scale(0.98); }

  .quick-action {
    flex:1; display:flex; flex-direction:column; align-items:center; gap:7px;
    padding:14px 8px; border-radius:16px; border:1.5px solid;
    cursor:pointer; background:none;
    font-family:'Sora',sans-serif; font-size:12px; font-weight:700;
    transition:all 0.15s;
  }
  .quick-action:hover  { opacity:0.82; }
  .quick-action:active { transform:scale(0.93); }

  .accordion-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 16px; cursor:pointer;
    transition:background 0.12s;
  }
  .accordion-header:hover { background:#FAFBFF; }

  .sheet-overlay {
    position:fixed; inset:0; z-index:200;
    background:rgba(13,18,38,0.58);
    display:flex; align-items:flex-end;
    animation:fadeIn 0.18s ease;
  }
  .sheet-body {
    background:#fff; border-radius:22px 22px 0 0;
    width:100%; padding:24px 20px 36px;
    animation:fadeSlideUp 0.26s cubic-bezier(.22,1,.36,1);
    box-shadow:0 -8px 40px rgba(0,0,0,0.16);
  }

  .nav-btn {
    flex:1; display:flex; flex-direction:column; align-items:center;
    padding:10px 0 12px; gap:4px; cursor:pointer;
    border:none; background:none;
    font-family:'Sora',sans-serif; font-size:10px; font-weight:500;
    transition:color 0.15s;
  }
`;

// ─── Animated Score Ring (pure SVG) ──────────────────────────────
function ScoreRing({ score, max, color, glow, size = 200, animate }) {
  const strokeW  = 14;
  const r        = (size - strokeW * 2) / 2;
  const cx       = size / 2;
  const cy       = size / 2;
  const circ     = 2 * Math.PI * r;
  const fillFrac = score / max;
  const offset   = circ * (1 - fillFrac);

  // Grade letter
  const cfg = scoreConfig(score, max);

  return (
    <div style={{ position:"relative", width:size, height:size }}>
      {/* Glow halo */}
      <div style={{
        position:"absolute",
        inset: -16,
        borderRadius:"50%",
        background:`radial-gradient(circle, ${glow} 0%, transparent 70%)`,
        animation: animate ? "glowPulse 2.5s ease-in-out infinite 1s" : "none",
        pointerEvents:"none",
      }}/>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position:"relative", zIndex:1 }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={tk.border}
          strokeWidth={strokeW}
        />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={animate ? circ : offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={animate ? {
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1) 0.3s",
          } : { strokeDashoffset: offset }}
        />
        {/* Score number */}
        <text
          x={cx} y={cy - 14}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily:"'JetBrains Mono',monospace",
            fontSize: size * 0.18,
            fontWeight: 800,
            fill: tk.text,
            animation: animate ? "countUp 0.5s cubic-bezier(.22,1,.36,1) 0.6s both" : "none",
          }}
        >
          {score}
        </text>
        <text
          x={cx} y={cy + 16}
          textAnchor="middle"
          style={{ fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:500, fill:tk.muted }}
        >
          out of {max}
        </text>
      </svg>

      {/* Grade badge — overlaid top-right */}
      <div style={{
        position:"absolute", top:8, right:8,
        width:36, height:36, borderRadius:"50%",
        background:cfg.pale,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:15, fontWeight:800, color:cfg.color,
        border:`2px solid ${cfg.color}`,
        animation: animate ? "gradePop 0.45s cubic-bezier(.22,1,.36,1) 0.9s both" : "none",
        opacity: animate ? 0 : 1,
      }}>
        {cfg.grade}
      </div>
    </div>
  );
}

// ─── Factor card with expandable advice ──────────────────────────
function FactorCard({ factorKey, score, index, animate }) {
  const [expanded, setExpanded] = useState(false);
  const meta   = FACTOR_META[factorKey];
  const pct    = score;
  const color  = pct >= 70 ? tk.green : pct >= 45 ? tk.amber : tk.red;
  const advice = factorAdvice(factorKey, pct);

  return (
    <div
      className="factor-card"
      onClick={() => setExpanded(e => !e)}
      style={{
        animation: animate ? `fadeSlideUp 0.35s ease ${0.05 + index * 0.08}s both` : "none",
        opacity:   animate ? 0 : 1,
      }}
    >
      {/* Top row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{
            width:32, height:32, borderRadius:9,
            background:color + "18",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, flexShrink:0,
          }}>
            {meta.icon}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:tk.text }}>{meta.label}</div>
            <div style={{ fontSize:11, color:tk.muted, marginTop:1 }}>{meta.tip}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{
            fontSize:14, fontWeight:800, color,
            fontFamily:"'JetBrains Mono',monospace",
          }}>
            {score}
            <span style={{ fontSize:10, fontWeight:500, color:tk.muted }}>/100</span>
          </span>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s", flexShrink:0 }}>
            <path d="M6 9l6 6 6-6" stroke={tk.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Bar */}
      <div className="factor-bar-bg">
        <div
          className="factor-bar-fill"
          style={{
            "--target": animate ? `${pct}%` : `${pct}%`,
            "--delay": `${0.4 + index * 0.1}s`,
            background: color,
            width: animate ? undefined : `${pct}%`,
          }}
        />
      </div>

      {/* Expanded advice */}
      {expanded && (
        <div style={{
          marginTop:12, padding:"10px 12px", borderRadius:10,
          background:color + "12",
          fontSize:12, color:tk.text, lineHeight:1.6,
          animation:"fadeSlideUp 0.2s ease",
          borderLeft:`3px solid ${color}`,
        }}>
          <span style={{ fontWeight:700, color }}>Advice: </span>{advice}
        </div>
      )}
    </div>
  );
}

// ─── Network comparison bar ───────────────────────────────────────
function NetworkComparison({ percentile, score, animate }) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    if (animate) { const id = setTimeout(() => setFilled(true), 600); return () => clearTimeout(id); }
    else setFilled(true);
  }, [animate]);

  const isGood = percentile >= 60;
  const color  = isGood ? tk.green : percentile >= 40 ? tk.amber : tk.red;

  return (
    <div style={{
      background:tk.card, borderRadius:16, padding:"16px",
      boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
      animation: animate ? "fadeSlideUp 0.35s ease 0.5s both" : "none",
      opacity: animate ? 0 : 1,
    }}>
      <div style={{ fontSize:12, fontWeight:700, color:tk.muted, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:10 }}>
        Network Comparison
      </div>
      <div style={{ fontSize:22, fontWeight:800, color, marginBottom:4 }}>
        Better than <span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{percentile}%</span>
      </div>
      <div style={{ fontSize:12, color:tk.muted, marginBottom:14, lineHeight:1.5 }}>
        of customers in your area on the GramSync network
      </div>

      {/* Percentile bar */}
      <div style={{ position:"relative" }}>
        <div style={{ height:10, background:tk.border, borderRadius:99, overflow:"hidden", marginBottom:6 }}>
          <div style={{
            height:"100%", borderRadius:99,
            background:`linear-gradient(to right, ${tk.red}, ${tk.amber} 50%, ${tk.green})`,
            width:"100%",
            clipPath: `inset(0 ${100 - (filled ? percentile : 0)}% 0 0)`,
            transition:"clip-path 1s cubic-bezier(.22,1,.36,1) 0.6s",
          }}/>
        </div>
        {/* Marker */}
        <div style={{
          position:"absolute", top:-3,
          left:`${percentile}%`,
          transform:"translateX(-50%)",
          width:16, height:16, borderRadius:"50%",
          background:"#fff", border:`3px solid ${color}`,
          boxShadow:`0 2px 6px ${color}44`,
          transition:"left 1s cubic-bezier(.22,1,.36,1) 0.6s",
        }}/>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:tk.muted, marginTop:6 }}>
          <span>Poor (300)</span>
          <span>Average</span>
          <span>Excellent (900)</span>
        </div>
      </div>
    </div>
  );
}

// ─── Score history sparkline ──────────────────────────────────────
function ScoreHistory({ history, labels, color, animate }) {
  const W = 340, H = 80;
  const min  = Math.min(...history) - 30;
  const max  = Math.max(...history) + 30;
  const pts  = history.map((v, i) => ({
    x: (i / (history.length - 1)) * (W - 40) + 20,
    y: H - 20 - ((v - min) / (max - min)) * (H - 40),
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`;
  const pathLen = pts.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const prev = pts[i-1];
    return acc + Math.hypot(p.x - prev.x, p.y - prev.y);
  }, 0);

  return (
    <div style={{
      background:tk.card, borderRadius:16, padding:"16px",
      boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
      animation: animate ? "fadeSlideUp 0.35s ease 0.6s both" : "none",
      opacity: animate ? 0 : 1,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ fontSize:12, fontWeight:700, color:tk.muted, letterSpacing:"0.06em", textTransform:"uppercase" }}>
          Score History
        </div>
        <div style={{ fontSize:11, color: history[history.length-1] > history[0] ? tk.green : tk.red, fontWeight:700 }}>
          {history[history.length-1] > history[0] ? "▲" : "▼"} {Math.abs(history[history.length-1] - history[0])} pts (6 months)
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
        {/* Area fill */}
        <path d={areaD} fill={color} opacity="0.08"/>
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={animate ? {
            strokeDasharray: pathLen,
            strokeDashoffset: pathLen,
            animation: `sparkDraw 1.2s cubic-bezier(.22,1,.36,1) 0.8s forwards`,
            "--len": pathLen,
          } : {}}
        />
        {/* Data points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === pts.length-1 ? 5 : 3}
            fill={i === pts.length-1 ? color : tk.card}
            stroke={color} strokeWidth="2"
          />
        ))}
        {/* Labels */}
        {pts.map((p, i) => (
          <text key={i} x={p.x} y={H - 2} textAnchor="middle"
            style={{ fontFamily:"'Sora',sans-serif", fontSize:9, fill:tk.muted, fontWeight:500 }}>
            {labels[i]}
          </text>
        ))}
        {/* Score value labels */}
        {pts.map((p, i) => (
          <text key={i} x={p.x} y={p.y - 8} textAnchor="middle"
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fill:color, fontWeight:700,
              opacity: i === pts.length-1 ? 1 : 0.5 }}>
            {history[i]}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── What affects score accordion ────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "How is the Gram Score calculated?",
    a: "The score combines repayment rate (40%), payment frequency (25%), credit history length (20%), and balance vs limit (15%). Data is updated across all GramSync merchants in your area every 24 hours.",
  },
  {
    q: "Can a score improve?",
    a: "Yes — scores update every 24 hours. Consistent on-time payments, regular partial payments, and reducing outstanding balance all raise the score within days.",
  },
  {
    q: "What is a 'good' score?",
    a: "630–900 is considered safe to lend. 450–629 is caution territory. Below 450 indicates significant default risk. The network average in most areas is 540–580.",
  },
  {
    q: "Can I dispute a score?",
    a: "If you believe the score is incorrect, use the dispute button to flag it. GramSync support will review the calculation within 24 hours.",
  },
];

function ScoreExplainer({ animate }) {
  const [open, setOpen] = useState(null);

  return (
    <div style={{
      background:tk.card, borderRadius:16,
      boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
      overflow:"hidden",
      animation: animate ? "fadeSlideUp 0.35s ease 0.7s both" : "none",
      opacity: animate ? 0 : 1,
    }}>
      <div style={{ padding:"14px 16px 10px", fontSize:12, fontWeight:700, color:tk.muted, letterSpacing:"0.06em", textTransform:"uppercase" }}>
        How it works
      </div>
      {FAQ_ITEMS.map((item, i) => (
        <div key={i}>
          <div style={{ height:1, background:tk.border, margin:"0 16px" }}/>
          <div className="accordion-header" onClick={() => setOpen(open === i ? null : i)}>
            <span style={{ fontSize:13, fontWeight:600, color:tk.text, flex:1, paddingRight:8 }}>{item.q}</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
              style={{ transform: open === i ? "rotate(180deg)" : "none", transition:"transform 0.2s", flexShrink:0 }}>
              <path d="M6 9l6 6 6-6" stroke={tk.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {open === i && (
            <div style={{
              padding:"0 16px 14px",
              fontSize:12, color:tk.muted, lineHeight:1.7,
              animation:"fadeSlideUp 0.18s ease",
            }}>
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Share Sheet ──────────────────────────────────────────────────
function ShareSheet({ customer, scoreData, cfg, onClose }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-body" onClick={e => e.stopPropagation()}>
        <div style={{ width:38, height:4, borderRadius:99, background:tk.border, margin:"0 auto 20px" }}/>
        <div style={{ fontSize:16, fontWeight:700, color:tk.text, marginBottom:16 }}>Share Score Summary</div>

        {/* Score card preview */}
        <div style={{
          background:`linear-gradient(135deg, #1a38e8, #3a5bff)`,
          borderRadius:16, padding:"18px", marginBottom:20, color:"#fff",
          position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute", right:-20, top:-20, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }}/>
          <div style={{ fontSize:11, opacity:0.7, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:6 }}>GramSync · Gram Score</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:36, fontWeight:800, fontFamily:"'JetBrains Mono',monospace" }}>{scoreData.score}</div>
              <div style={{ fontSize:12, opacity:0.75 }}>out of {scoreData.max}</div>
            </div>
            <div style={{
              background:cfg.pale, color:cfg.color,
              borderRadius:10, padding:"6px 14px",
              fontSize:12, fontWeight:800,
            }}>
              {cfg.label}
            </div>
          </div>
          <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.15)", fontSize:12, opacity:0.75 }}>
            {customer.name} · {customer.id} · Updated {scoreData.updated}
          </div>
        </div>

        {[
          { label:"Share via WhatsApp", bg:"#25D366", color:"#fff", shadow:"rgba(37,211,102,0.3)" },
          { label:"Copy Summary Text",  bg:tk.bluePale, color:tk.blue, shadow:null },
        ].map((opt, i) => (
          <button key={i} onClick={onClose} style={{
            width:"100%", padding:"14px", borderRadius:14, border:"none",
            background:opt.bg, color:opt.color, marginBottom:10,
            fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14,
            cursor:"pointer",
            boxShadow: opt.shadow ? `0 4px 14px ${opt.shadow}` : "none",
          }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────
function Topbar({ customer, onBack, onShare }) {
  return (
    <div style={{
      background:"#fff", padding:"14px 16px",
      display:"flex", alignItems:"center", gap:10,
      borderBottom:`1px solid ${tk.border}`,
      position:"sticky", top:0, zIndex:50,
    }}>
      <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", flexShrink:0 }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke={tk.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:17, fontWeight:700, color:tk.text }}>Gram Score</div>
        <div style={{ fontSize:11, color:tk.muted, marginTop:1 }}>{customer.name}</div>
      </div>
      <button onClick={onShare} style={{
        background:tk.bluePale, border:"none", borderRadius:10,
        padding:"7px 14px", cursor:"pointer",
        fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:700, color:tk.blue,
        display:"flex", alignItems:"center", gap:5,
        transition:"background 0.15s",
      }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <circle cx="18" cy="5" r="3" stroke={tk.blue} strokeWidth="1.8"/>
          <circle cx="6"  cy="12" r="3" stroke={tk.blue} strokeWidth="1.8"/>
          <circle cx="18" cy="19" r="3" stroke={tk.blue} strokeWidth="1.8"/>
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke={tk.blue} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Share
      </button>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────
function QuickActions({ cfg, onCredit, onReminder, onProfile }) {
  const actions = [
    {
      label:   "Give Credit",
      color:   tk.orange,
      bg:      tk.orangePale,
      onClick: onCredit,
      icon:    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke={tk.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    {
      label:   "Send Reminder",
      color:   tk.blue,
      bg:      tk.bluePale,
      onClick: onReminder,
      icon:    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke={tk.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    {
      label:   "View Profile",
      color:   tk.green,
      bg:      tk.greenPale,
      onClick: onProfile,
      icon:    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke={tk.green} strokeWidth="1.8"/><path d="M5 20v-1a7 7 0 0114 0v1" stroke={tk.green} strokeWidth="1.8" strokeLinecap="round"/></svg>,
    },
  ];

  return (
    <div style={{ display:"flex", gap:10, padding:"0 16px 16px" }}>
      {actions.map((a, i) => (
        <button key={i} className="quick-action"
          style={{ borderColor:a.bg, color:a.color }}
          onClick={a.onClick}
        >
          <div style={{ width:40, height:40, borderRadius:12, background:a.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {a.icon}
          </div>
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Customer context pill ─────────────────────────────────────────
function CustomerPill({ customer, animate }) {
  const usageRatio = customer.balance / customer.creditLimit;
  const barColor   = usageRatio > 0.85 ? tk.red : usageRatio > 0.6 ? tk.amber : tk.green;

  return (
    <div style={{
      margin:"0 16px 14px", background:tk.card, borderRadius:14,
      padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
      animation: animate ? "fadeSlideUp 0.3s ease 0.15s both" : "none",
      opacity: animate ? 0 : 1,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
        <div style={{
          width:42, height:42, borderRadius:"50%",
          background:tk.bluePale, color:tk.blue,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:800, fontSize:14, flexShrink:0,
        }}>{customer.initials}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:tk.text }}>{customer.name}</div>
          <div style={{ fontSize:11, color:tk.muted, marginTop:1 }}>{customer.phone} · Member since {customer.memberSince}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:14, fontWeight:800, color:tk.orange, fontFamily:"'JetBrains Mono',monospace" }}>
            ₹{customer.balance.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize:10, color:tk.muted, marginTop:1 }}>current balance</div>
        </div>
      </div>

      {/* Credit limit bar */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:tk.muted, marginBottom:4 }}>
          <span>Credit usage</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:600, color:barColor }}>
            ₹{customer.balance.toLocaleString("en-IN")} / ₹{customer.creditLimit.toLocaleString("en-IN")}
          </span>
        </div>
        <div style={{ height:6, background:tk.border, borderRadius:99, overflow:"hidden" }}>
          <div style={{
            height:"100%", background:barColor, borderRadius:99,
            width: animate ? `${Math.min(usageRatio * 100, 100)}%` : `${Math.min(usageRatio * 100, 100)}%`,
            transition:"width 0.8s cubic-bezier(.22,1,.36,1) 0.5s",
          }}/>
        </div>
      </div>
    </div>
  );
}

// ─── Score verdict hero ───────────────────────────────────────────
function VerdictHero({ cfg, score, max, updated, animate }) {
  return (
    <div style={{
      margin:"16px 16px 0",
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"24px 20px 20px",
      background:tk.card, borderRadius:20,
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
      animation: animate ? "scaleIn 0.45s cubic-bezier(.22,1,.36,1) 0.05s both" : "none",
      opacity: animate ? 0 : 1,
      position:"relative", overflow:"hidden",
    }}>
      {/* Soft background hue */}
      <div style={{
        position:"absolute", inset:0,
        background:`radial-gradient(ellipse at 50% 0%, ${cfg.pale} 0%, transparent 65%)`,
        pointerEvents:"none",
      }}/>

      <div style={{ position:"relative", zIndex:1 }}>
        <ScoreRing score={score} max={max} color={cfg.color} glow={cfg.ringGlow} size={200} animate={animate}/>
      </div>

      {/* Verdict badge */}
      <div style={{
        marginTop:16,
        background:cfg.pale, color:cfg.color,
        borderRadius:99, padding:"6px 20px",
        fontSize:12, fontWeight:800, letterSpacing:"0.05em",
        border:`1px solid ${cfg.color}30`,
        animation: animate ? "fadeSlideUp 0.3s ease 0.85s both" : "none",
        opacity: animate ? 0 : 1,
      }}>
        {cfg.label}
      </div>

      {/* Advice */}
      <div style={{
        marginTop:10, textAlign:"center",
        fontSize:13, color:tk.muted, lineHeight:1.6,
        maxWidth:300, padding:"0 10px",
        animation: animate ? "fadeSlideUp 0.3s ease 0.95s both" : "none",
        opacity: animate ? 0 : 1,
      }}>
        {cfg.advice}
      </div>

      {/* Updated */}
      <div style={{
        marginTop:12, fontSize:11, color:tk.muted,
        display:"flex", alignItems:"center", gap:5,
        animation: animate ? "fadeSlideUp 0.3s ease 1.05s both" : "none",
        opacity: animate ? 0 : 1,
      }}>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke={tk.muted} strokeWidth="1.5"/>
          <path d="M12 7v5l3 3" stroke={tk.muted} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Score updated {updated} · Reflects network payment data
      </div>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"home",      label:"HOME"      },
  { id:"customers", label:"CUSTOMERS" },
  { id:"reports",   label:"REPORTS"   },
  { id:"settings",  label:"SETTINGS"  },
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
    <nav style={{ background:tk.card, borderTop:`1px solid ${tk.border}`, display:"flex", zIndex:100 }}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} className="nav-btn"
          onClick={() => onNavigate?.(item.id)}
          style={{ color: item.id === "customers" ? tk.blue : tk.muted }}>
          <NavIcon id={item.id}/>{item.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Section label ────────────────────────────────────────────────
function SectionLabel({ children, delay, animate }) {
  return (
    <div style={{
      fontSize:11, fontWeight:700, color:tk.muted,
      letterSpacing:"0.07em", textTransform:"uppercase",
      padding:"16px 16px 8px",
      animation: animate ? `fadeSlideUp 0.3s ease ${delay}s both` : "none",
      opacity: animate ? 0 : 1,
    }}>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
/**
 * GramScoreDetail
 *
 * Props:
 *  - customer     {object}    Customer info
 *  - scoreData    {object}    Score, factors, history
 *  - onBack       {fn}
 *  - onNavigate   {fn}
 *  - onCredit     {(customer) => void}
 *  - onReminder   {(customer) => void}
 *  - onProfile    {(customer) => void}
 */
function GramScoreDetail({
  customer  = DEFAULT_CUSTOMER,
  scoreData = DEFAULT_SCORE_DATA,
  onBack      = () => {},
  onNavigate  = () => {},
  onCredit    = () => {},
  onReminder  = () => {},
  onProfile   = () => {},
}) {
  const [shown,       setShown]       = useState(false);
  const [animate,     setAnimate]     = useState(false);
  const [showShare,   setShowShare]   = useState(false);

  const cfg = scoreConfig(scoreData.score, scoreData.max);

  useEffect(() => {
    const t1 = setTimeout(() => setShown(true),   60);
    const t2 = setTimeout(() => setAnimate(true), 100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{
        width:"100%", maxWidth:420, minHeight:"100vh",
        background:tk.bg, display:"flex", flexDirection:"column",
        margin:"0 auto", fontFamily:"'Sora',sans-serif",
        opacity: shown ? 1 : 0, transition:"opacity 0.25s ease",
      }}>
        <Topbar
          customer={customer}
          onBack={onBack}
          onShare={() => setShowShare(true)}
        />

        <div style={{ flex:1, overflowY:"auto", paddingBottom:24 }}>
          {/* Score ring hero */}
          <VerdictHero
            cfg={cfg}
            score={scoreData.score}
            max={scoreData.max}
            updated={scoreData.updated}
            animate={animate}
          />

          {/* Quick actions */}
          <div style={{ padding:"14px 16px 0" }}>
            <QuickActions
              cfg={cfg}
              onCredit={() => onCredit(customer)}
              onReminder={() => onReminder(customer)}
              onProfile={() => onProfile(customer)}
            />
          </div>

          {/* Customer context */}
          <SectionLabel delay={0.25} animate={animate}>Customer Overview</SectionLabel>
          <CustomerPill customer={customer} animate={animate}/>

          {/* Factor breakdown */}
          <SectionLabel delay={0.3} animate={animate}>Score Breakdown</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:10, padding:"0 16px" }}>
            {Object.entries(scoreData.factors).map(([key, val], i) => (
              <FactorCard key={key} factorKey={key} score={val} index={i} animate={animate}/>
            ))}
          </div>

          {/* Network comparison */}
          <SectionLabel delay={0.45} animate={animate}>Network Standing</SectionLabel>
          <div style={{ padding:"0 16px" }}>
            <NetworkComparison
              percentile={scoreData.networkPercentile}
              score={scoreData.score}
              animate={animate}
            />
          </div>

          {/* Score history */}
          <SectionLabel delay={0.55} animate={animate}>6-Month Trend</SectionLabel>
          <div style={{ padding:"0 16px" }}>
            <ScoreHistory
              history={scoreData.history}
              labels={scoreData.historyLabels}
              color={cfg.color}
              animate={animate}
            />
          </div>

          {/* Explainer accordion */}
          <SectionLabel delay={0.65} animate={animate}>Understanding the Score</SectionLabel>
          <div style={{ padding:"0 16px", marginBottom:8 }}>
            <ScoreExplainer animate={animate}/>
          </div>

          {/* Dispute link */}
          <div style={{
            textAlign:"center", padding:"8px 16px 4px",
            fontSize:12, color:tk.muted,
            animation: animate ? "fadeSlideUp 0.3s ease 0.75s both" : "none",
            opacity: animate ? 0 : 1,
          }}>
            Score incorrect?{" "}
            <span style={{ color:tk.blue, fontWeight:700, cursor:"pointer" }}>
              Dispute this score
            </span>
          </div>

          <div style={{ padding:"4px 16px 4px", textAlign:"center" }}>
            <span style={{ fontSize:10, color:tk.muted }}>
              Range: 300 (poor) – 900 (excellent) · GramSync Network™
            </span>
          </div>
        </div>

        <BottomNav onNavigate={onNavigate}/>

        {showShare && (
          <ShareSheet
            customer={customer}
            scoreData={scoreData}
            cfg={cfg}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>
    </>
  );
}

export default GramScoreDetail;
export { GramScoreDetail };
