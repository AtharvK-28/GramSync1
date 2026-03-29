// Authentication.jsx
// GramSync Merchant App — Auth Flow
// Screens: Phone Login → OTP Verify → PIN Setup/Entry → Success
// Deps: pure React, no external libraries

import { useState, useEffect, useRef, useCallback } from "react";

const t = {
  blue:       "#2347F5",
  blueMid:    "#3A5BFF",
  bluePale:   "#EEF1FF",
  green:      "#0BAF60",
  greenPale:  "#E6F9F0",
  orange:     "#F56A00",
  red:        "#E8304A",
  bg:         "#F0F2F8",
  card:       "#FFFFFF",
  text:       "#0D1226",
  muted:      "#7A85A3",
  border:     "#E2E6F3",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  html, body { height:100%; }
  body { background:#F0F2F8; font-family:'Sora',sans-serif; }
  ::-webkit-scrollbar { display:none; }

  @keyframes fadeSlideUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes slideLeft {
    from { opacity:0; transform:translateX(28px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes shake {
    0%,100% { transform:translateX(0); }
    20%      { transform:translateX(-8px); }
    40%      { transform:translateX(8px); }
    60%      { transform:translateX(-5px); }
    80%      { transform:translateX(5px); }
  }
  @keyframes successPop {
    0%   { transform:scale(0.4) rotate(-12deg); opacity:0; }
    65%  { transform:scale(1.12) rotate(2deg); opacity:1; }
    100% { transform:scale(1) rotate(0deg); }
  }
  @keyframes confettiDrop {
    0%   { transform:translateY(-10px) rotate(0deg); opacity:1; }
    100% { transform:translateY(100px) rotate(420deg); opacity:0; }
  }
  @keyframes pulse {
    0%,100% { transform:scale(1); }
    50%      { transform:scale(1.04); }
  }
  @keyframes otpBounce {
    0%   { transform:scale(1); }
    40%  { transform:scale(1.18); }
    100% { transform:scale(1); }
  }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes dotPulse {
    0%,80%,100% { transform:scale(0.6); opacity:0.4; }
    40%          { transform:scale(1);   opacity:1; }
  }

  .phone-input {
    flex:1; background:none; border:none; outline:none;
    font-family:'JetBrains Mono',monospace;
    font-size:20px; font-weight:600; color:#0D1226;
    letter-spacing:0.06em;
  }
  .phone-input::placeholder { color:#C5CBD8; font-weight:400; letter-spacing:0; font-size:16px; }

  .auth-btn {
    width:100%; padding:17px; border-radius:16px; border:none;
    font-family:'Sora',sans-serif; font-weight:800; font-size:16px;
    cursor:pointer; transition:transform 0.12s, filter 0.12s, background 0.2s;
  }
  .auth-btn:hover  { filter:brightness(1.06); }
  .auth-btn:active { transform:scale(0.97); }
  .auth-btn:disabled { filter:none; cursor:default; }

  .num-key {
    height:62px;
    background:#fff;
    border:none; border-radius:14px;
    font-family:'Sora',sans-serif; font-size:20px; font-weight:600;
    color:#0D1226; cursor:pointer;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:1px;
    box-shadow:0 1px 3px rgba(0,0,0,0.05);
    transition:background 0.1s, transform 0.1s;
    user-select:none;
  }
  .num-key:hover  { background:#F4F6FB; }
  .num-key:active { background:#E8EDF8; transform:scale(0.94); }
  .num-key.del    { background:#F4F6FB; }

  .otp-cell {
    width:52px; height:60px; border-radius:14px;
    border:2px solid #E2E6F3;
    display:flex; align-items:center; justify-content:center;
    font-family:'JetBrains Mono',monospace;
    font-size:26px; font-weight:800; color:#0D1226;
    transition:border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  }
  .otp-cell.active {
    border-color:#2347F5;
    box-shadow:0 0 0 3px rgba(35,71,245,0.15);
    animation:otpBounce 0.2s ease;
  }
  .otp-cell.filled { border-color:#2347F5; background:#EEF1FF; }
  .otp-cell.error  { border-color:#E8304A; background:#FFEBEE; animation:shake 0.35s ease; }
`;

// ─── Confetti ─────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#2347F5","#0BAF60","#F56A00","#F5A623","#E8304A"];
function Confetti() {
  const items = Array.from({ length: 20 }, (_, i) => ({
    left: `${5 + Math.random() * 90}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${Math.random() * 0.5}s`,
    size: 6 + Math.random() * 8,
    dur: `${0.7 + Math.random() * 0.7}s`,
    shape: Math.random() > 0.5,
  }));
  return (
    <div style={{ position:"absolute", top:0, left:0, right:0, height:160, pointerEvents:"none", overflow:"hidden" }}>
      {items.map((p,i) => (
        <div key={i} style={{
          position:"absolute", top:-12, left:p.left,
          width:p.size, height:p.size,
          borderRadius: p.shape ? "50%" : "2px",
          background:p.color,
          animation:`confettiDrop ${p.dur} ease-in ${p.delay} forwards`,
          opacity:0,
        }} />
      ))}
    </div>
  );
}

// ─── GramSync Logo Mark ───────────────────────────────────────────
function LogoMark({ size = 52 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius: size * 0.22,
      background:`linear-gradient(135deg, #2347F5, #3A5BFF)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:"0 4px 16px rgba(35,71,245,0.35)",
    }}>
      <svg width={size*0.6} height={size*0.6} viewBox="0 0 32 32" fill="none">
        <path d="M4 26l7-9 5 6 4-5 6 8H4z" fill="#fff" opacity="0.95"/>
        <circle cx="24" cy="9" r="4" fill="#fff"/>
      </svg>
    </div>
  );
}

// ─── Dot loader ───────────────────────────────────────────────────
function DotLoader() {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"center", justifyContent:"center" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:8, height:8, borderRadius:"50%", background:"#fff",
          animation:`dotPulse 1.2s ease-in-out ${i*0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── PIN dots ─────────────────────────────────────────────────────
function PinDots({ length = 4, filled, error }) {
  return (
    <div style={{
      display:"flex", gap:16, justifyContent:"center",
      animation: error ? "shake 0.35s ease" : "none",
    }}>
      {Array.from({ length }).map((_, i) => (
        <div key={i} style={{
          width:18, height:18, borderRadius:"50%",
          background: i < filled ? (error ? t.red : t.blue) : t.border,
          border: `2px solid ${i < filled ? (error ? t.red : t.blue) : t.border}`,
          transition:"background 0.15s, border-color 0.15s, transform 0.12s",
          transform: i === filled - 1 && !error ? "scale(1.2)" : "scale(1)",
        }} />
      ))}
    </div>
  );
}

// ─── Numpad ───────────────────────────────────────────────────────
function Numpad({ onPress, onDelete, onBiometric, showBiometric = false }) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","del"];
  const letters = { "2":"ABC","3":"DEF","4":"GHI","5":"JKL","6":"MNO","7":"PQRS","8":"TUV","9":"WXYZ" };
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
      {keys.map((k,i) => {
        if (k === "") {
          return showBiometric ? (
            <button key={i} className="num-key" onClick={onBiometric} style={{ background:"#EEF1FF" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  stroke={t.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : <div key={i} />;
        }
        if (k === "del") return (
          <button key={i} className="num-key del" onClick={onDelete}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" stroke={t.muted} strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M18 9l-6 6M12 9l6 6" stroke={t.muted} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        );
        return (
          <button key={i} className="num-key" onClick={() => onPress(k)}>
            <span>{k}</span>
            {letters[k] && <span style={{ fontSize:9, color:t.muted, letterSpacing:"0.08em", fontWeight:500 }}>{letters[k]}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STEP 1 — Phone number entry
// ══════════════════════════════════════════════════════════════════
function PhoneStep({ onNext }) {
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const valid = phone.replace(/\D/g,"").length === 10;

  const handleSubmit = () => {
    if (!valid) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onNext(phone); }, 1400);
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 32px", animation:"fadeSlideUp 0.3s ease" }}>
      {/* Hero */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", paddingBottom:20 }}>
        <LogoMark size={64} />
        <div style={{ marginTop:20, marginBottom:8, fontSize:26, fontWeight:800, color:t.text, textAlign:"center" }}>
          Welcome to GramSync
        </div>
        <div style={{ fontSize:14, color:t.muted, textAlign:"center", lineHeight:1.6 }}>
          India's trusted merchant credit network.<br/>Enter your mobile number to continue.
        </div>
      </div>

      {/* Input card */}
      <div style={{ background:"#fff", borderRadius:20, padding:"20px", marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:12, fontWeight:600, color:t.muted, marginBottom:10, letterSpacing:"0.04em", textTransform:"uppercase" }}>
          Mobile Number
        </div>
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          border:`2px solid ${phone ? t.blue : t.border}`,
          borderRadius:12, padding:"12px 16px",
          transition:"border-color 0.15s",
        }}>
          {/* Country flag placeholder */}
          <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, paddingRight:8, borderRight:`1px solid ${t.border}` }}>
            <div style={{ width:20, height:14, borderRadius:2, background:"linear-gradient(180deg, #FF9933 33%, #fff 33%, #fff 66%, #138808 66%)", fontSize:0 }} />
            <span style={{ fontSize:14, fontWeight:700, color:t.text, fontFamily:"'JetBrains Mono',monospace" }}>+91</span>
          </div>
          <input
            className="phone-input"
            placeholder="98765 43210"
            value={phone}
            onChange={e => {
              const raw = e.target.value.replace(/\D/g,"").slice(0,10);
              setPhone(raw.replace(/(\d{5})(\d+)/, "$1 $2"));
            }}
            inputMode="numeric"
          />
          {valid && (
            <div style={{ width:24, height:24, borderRadius:"50%", background:t.greenPale, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke={t.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>

        <div style={{ fontSize:11, color:t.muted, marginTop:10, textAlign:"center" }}>
          We'll send a 6-digit OTP to verify your number
        </div>
      </div>

      <button className="auth-btn" onClick={handleSubmit} disabled={!valid || loading}
        style={{
          background: valid ? t.blue : t.border,
          color: valid ? "#fff" : t.muted,
          boxShadow: valid ? "0 4px 18px rgba(35,71,245,0.35)" : "none",
        }}>
        {loading ? <DotLoader /> : "Send OTP →"}
      </button>

      <div style={{ textAlign:"center", marginTop:16, fontSize:12, color:t.muted }}>
        By continuing you agree to our{" "}
        <span style={{ color:t.blue, fontWeight:600, cursor:"pointer" }}>Terms</span> &amp;{" "}
        <span style={{ color:t.blue, fontWeight:600, cursor:"pointer" }}>Privacy Policy</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STEP 2 — OTP verification
// ══════════════════════════════════════════════════════════════════
function OTPStep({ phone, onNext, onBack }) {
  const [otp,       setOtp]     = useState(["","","","","",""]);
  const [error,     setError]   = useState(false);
  const [verifying, setVerify]  = useState(false);
  const [resendSec, setResend]  = useState(30);
  const inputRefs = useRef([]);

  // Countdown
  useEffect(() => {
    if (resendSec <= 0) return;
    const id = setInterval(() => setResend(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendSec]);

  const handleInput = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setError(false);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (next.every(d => d) && idx === 5) triggerVerify(next);
  };

  const handleKey = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const triggerVerify = (digits) => {
    const code = (digits || otp).join("");
    if (code.length < 6) return;
    setVerify(true);
    setTimeout(() => {
      setVerify(false);
      if (code === "123456" || true) { // always pass for demo
        onNext();
      } else {
        setError(true);
        setOtp(["","","","","",""]);
        inputRefs.current[0]?.focus();
      }
    }, 1200);
  };

  const displayPhone = phone.replace(/\D/g,"").replace(/(\d{2})(\d{4})(\d{4})/, "+91 $1*** $3");

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 32px", animation:"slideLeft 0.25s ease" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", paddingBottom:16 }}>
        {/* Icon */}
        <div style={{
          width:72, height:72, borderRadius:"50%",
          background:t.bluePale,
          display:"flex", alignItems:"center", justifyContent:"center",
          marginBottom:20,
          animation:"pulse 2s ease-in-out infinite",
        }}>
          <svg width="34" height="34" fill="none" viewBox="0 0 24 24">
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              stroke={t.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ fontSize:22, fontWeight:800, color:t.text, marginBottom:8, textAlign:"center" }}>
          Check your SMS
        </div>
        <div style={{ fontSize:13, color:t.muted, textAlign:"center", lineHeight:1.7 }}>
          We sent a 6-digit code to<br/>
          <strong style={{ color:t.text }}>{displayPhone}</strong>
        </div>
      </div>

      {/* OTP inputs */}
      <div style={{ background:"#fff", borderRadius:20, padding:"24px 20px", marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:16 }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              className={`otp-cell ${digit ? "filled" : ""} ${error ? "error" : ""} ${!digit && otp.slice(0,i).every(d=>d) ? "active" : ""}`}
              style={{
                width:46, height:56, borderRadius:12,
                border:`2px solid ${error ? t.red : digit ? t.blue : t.border}`,
                background: error ? "#FFEBEE" : digit ? t.bluePale : "#fff",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:24, fontWeight:800, color: error ? t.red : t.text,
                textAlign:"center",
                outline:"none",
                transition:"border-color 0.15s, background 0.15s",
              }}
              maxLength={1}
              inputMode="numeric"
              value={digit}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <div style={{ textAlign:"center", color:t.red, fontSize:12, fontWeight:600, marginBottom:8 }}>
            ✕ Incorrect OTP. Please try again.
          </div>
        )}

        <div style={{ textAlign:"center", fontSize:12, color:t.muted }}>
          {resendSec > 0 ? (
            <>Resend OTP in <strong style={{ color:t.text }}>{resendSec}s</strong></>
          ) : (
            <span onClick={() => { setResend(30); setOtp(["","","","","",""]); }} style={{ color:t.blue, fontWeight:700, cursor:"pointer" }}>
              Resend OTP
            </span>
          )}
        </div>
      </div>

      {/* Demo hint */}
      <div style={{ background:t.bluePale, borderRadius:12, padding:"10px 14px", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke={t.blue} strokeWidth="1.5"/>
          <path d="M12 8v4m0 4h.01" stroke={t.blue} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize:11, color:t.blue, fontWeight:600 }}>Demo: enter any 6 digits to continue</span>
      </div>

      <button className="auth-btn" onClick={() => triggerVerify(otp)}
        disabled={otp.some(d => !d) || verifying}
        style={{
          background: otp.every(d=>d) ? t.blue : t.border,
          color: otp.every(d=>d) ? "#fff" : t.muted,
          boxShadow: otp.every(d=>d) ? "0 4px 18px rgba(35,71,245,0.35)" : "none",
        }}>
        {verifying ? <DotLoader /> : "Verify OTP →"}
      </button>

      <button onClick={onBack} style={{
        background:"none", border:"none", marginTop:14,
        fontFamily:"'Sora',sans-serif", fontSize:13, color:t.muted,
        cursor:"pointer", fontWeight:500,
      }}>
        ← Change number
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STEP 3 — PIN setup / entry
// ══════════════════════════════════════════════════════════════════
function PINStep({ isSetup = true, onNext, onBack }) {
  const [pin,       setPin]      = useState("");
  const [confirmPin,setConfirm]  = useState("");
  const [stage,     setStage]    = useState("enter"); // "enter" | "confirm"
  const [error,     setError]    = useState(false);
  const PIN_LEN = 4;

  const handlePress = (key) => {
    const current = stage === "confirm" ? confirmPin : pin;
    if (current.length >= PIN_LEN) return;
    const next = current + key;
    if (stage === "confirm") {
      setConfirm(next);
      if (next.length === PIN_LEN) {
        if (next === pin) { setTimeout(() => onNext(), 300); }
        else {
          setError(true);
          setTimeout(() => { setError(false); setConfirm(""); }, 800);
        }
      }
    } else {
      setPin(next);
      if (!isSetup && next.length === PIN_LEN) {
        setTimeout(() => onNext(), 300);
      } else if (isSetup && next.length === PIN_LEN) {
        setTimeout(() => setStage("confirm"), 300);
      }
    }
  };

  const handleDelete = () => {
    if (stage === "confirm") setConfirm(p => p.slice(0,-1));
    else setPin(p => p.slice(0,-1));
  };

  const currentLen = stage === "confirm" ? confirmPin.length : pin.length;

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 24px", animation:"slideLeft 0.25s ease" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
        {/* Lock icon */}
        <div style={{
          width:72, height:72, borderRadius:"50%",
          background:t.bluePale,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <svg width="34" height="34" fill="none" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke={t.blue} strokeWidth="1.8"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke={t.blue} strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1.5" fill={t.blue}/>
          </svg>
        </div>

        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:800, color:t.text, marginBottom:6 }}>
            {isSetup
              ? (stage === "confirm" ? "Confirm your PIN" : "Set up your PIN")
              : "Enter your PIN"}
          </div>
          <div style={{ fontSize:13, color:t.muted, lineHeight:1.6 }}>
            {isSetup
              ? (stage === "confirm"
                  ? "Re-enter the 4-digit PIN to confirm"
                  : "Choose a 4-digit PIN to secure your account")
              : "Enter your 4-digit PIN to continue"}
          </div>
        </div>

        <PinDots length={PIN_LEN} filled={currentLen} error={error} />

        {error && (
          <div style={{ fontSize:12, color:t.red, fontWeight:600 }}>
            PINs don't match. Try again.
          </div>
        )}
      </div>

      {/* Numpad */}
      <div style={{ marginBottom:12 }}>
        <Numpad onPress={handlePress} onDelete={handleDelete} showBiometric={!isSetup} />
      </div>

      {!isSetup && (
        <button style={{
          background:"none", border:"none",
          fontFamily:"'Sora',sans-serif", fontSize:12, color:t.muted,
          cursor:"pointer", textAlign:"center", fontWeight:500,
        }}>
          Forgot PIN? Recover via OTP
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STEP 4 — Success / Welcome
// ══════════════════════════════════════════════════════════════════
function SuccessStep({ isNewUser = true, onDone }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"0 24px 40px", position:"relative",
      overflow:"hidden",
    }}>
      <Confetti />

      <div style={{
        width:96, height:96, borderRadius:"50%",
        background:`linear-gradient(135deg, #E6F9F0, #CCF2E1)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        marginBottom:24,
        animation:"successPop 0.45s cubic-bezier(.22,1,.36,1)",
        boxShadow:"0 8px 32px rgba(11,175,96,0.25)",
      }}>
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke={t.green} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div style={{ fontSize:26, fontWeight:800, color:t.text, textAlign:"center", marginBottom:10 }}>
        {isNewUser ? "You're all set! 🎉" : "Welcome back!"}
      </div>
      <div style={{ fontSize:14, color:t.muted, textAlign:"center", lineHeight:1.7, marginBottom:36 }}>
        {isNewUser
          ? "Your GramSync merchant account is ready.\nStart recording Udhar & Jama transactions."
          : "Your account is verified and synced.\nAll your data is up to date."}
      </div>

      {/* Feature highlights (new users only) */}
      {isNewUser && (
        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:10, marginBottom:32 }}>
          {[
            { icon:"💳", label:"Track Udhar & Jama",   sub:"Record credit & payments instantly" },
            { icon:"📊", label:"Gram Score™",           sub:"Customer trust scores in real-time"  },
            { icon:"☁️", label:"Cloud Sync",             sub:"Your data is always backed up"       },
          ].map((f,i) => (
            <div key={i} style={{
              background:"#fff", borderRadius:14, padding:"12px 16px",
              display:"flex", alignItems:"center", gap:12,
              boxShadow:"0 1px 3px rgba(0,0,0,0.05)",
              animation:`fadeSlideUp 0.3s ease ${0.1 + i * 0.08}s both`,
            }}>
              <div style={{ fontSize:22, width:36, textAlign:"center" }}>{f.icon}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:t.text }}>{f.label}</div>
                <div style={{ fontSize:11, color:t.muted, marginTop:1 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="auth-btn" onClick={onDone}
        style={{ background:t.blue, color:"#fff", boxShadow:"0 4px 18px rgba(35,71,245,0.35)" }}>
        {isNewUser ? "Start Using GramSync →" : "Go to Dashboard →"}
      </button>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div style={{ display:"flex", gap:6, padding:"12px 24px 0" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex:1, height:3, borderRadius:99,
          background: i < step ? t.blue : t.border,
          transition:"background 0.3s ease",
        }} />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

/**
 * Authentication
 *
 * Props:
 *  - mode         {"login"|"signup"}   default "login"
 *  - onAuthDone   {() => void}         called when auth completes
 */
export default function Authentication({
  mode       = "login",
  onAuthDone = () => {},
}) {
  // Steps: phone → otp → pin → success
  const STEPS = mode === "login"
    ? ["phone","otp","pin","success"]
    : ["phone","otp","pin-setup","success"];

  const [stepIdx, setStepIdx] = useState(0);
  const [phone,   setPhone]   = useState("");

  const step = STEPS[stepIdx];
  const next = () => setStepIdx(i => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIdx(i => Math.max(i - 1, 0));

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{
        width:"100%", maxWidth:420, minHeight:"100vh",
        background:t.bg, display:"flex", flexDirection:"column",
        margin:"0 auto", fontFamily:"'Sora',sans-serif",
      }}>
        {/* Top area */}
        <div style={{ background:"#fff", paddingBottom:6 }}>
          {/* Header */}
          <div style={{ padding:"18px 20px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            {stepIdx > 0 && step !== "success" ? (
              <button onClick={back} style={{
                background:"none", border:"none", cursor:"pointer",
                display:"flex", alignItems:"center", gap:6, color:t.muted,
                fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:600,
              }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
            ) : <div style={{ width:48 }} />}

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <LogoMark size={28} />
              <span style={{ fontSize:16, fontWeight:800, color:t.text }}>GramSync</span>
            </div>

            <div style={{ fontSize:11, fontWeight:700, color:t.muted, letterSpacing:"0.04em", textTransform:"uppercase" }}>
              {mode === "login" ? "Sign In" : "Sign Up"}
            </div>
          </div>

          {/* Progress */}
          {step !== "success" && (
            <ProgressBar step={stepIdx + 1} total={STEPS.length} />
          )}
        </div>

        {/* Screen */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", paddingTop:24 }}>
          {step === "phone" && (
            <PhoneStep onNext={p => { setPhone(p); next(); }} />
          )}
          {step === "otp" && (
            <OTPStep phone={phone} onNext={next} onBack={back} />
          )}
          {(step === "pin" || step === "pin-setup") && (
            <PINStep isSetup={step === "pin-setup"} onNext={next} onBack={back} />
          )}
          {step === "success" && (
            <SuccessStep isNewUser={mode === "signup"} onDone={onAuthDone} />
          )}
        </div>
      </div>
    </>
  );
}