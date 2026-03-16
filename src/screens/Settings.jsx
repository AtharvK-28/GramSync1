// Settings.jsx
// GramSync Merchant App â€” Settings Screen
// Sections: Profile, Store, Preferences, Security, Danger Zone, About
// Deps: pure React, no external libraries

import { useState, useCallback, useEffect } from "react";

const t = {
  blue:       "#2347F5",
  bluePale:   "#EEF1FF",
  green:      "#0BAF60",
  greenPale:  "#E6F9F0",
  orange:     "#F56A00",
  orangePale: "#FFF0E5",
  red:        "#E8304A",
  redPale:    "#FFEBEE",
  yellow:     "#F5A623",
  bg:         "#F0F2F8",
  card:       "#FFFFFF",
  text:       "#0D1226",
  muted:      "#7A85A3",
  border:     "#E2E6F3",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  body { background:#F0F2F8; font-family:'Sora',sans-serif; }
  ::-webkit-scrollbar { display:none; }

  @keyframes fadeSlideUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  .settings-row {
    display:flex; align-items:center;
    padding:15px 16px;
    cursor:pointer;
    transition:background 0.12s;
  }
  .settings-row:hover { background:#FAFBFF; }
  .settings-row:active { background:#F4F6FB; }

  .toggle-track {
    width:46px; height:26px; border-radius:99px;
    cursor:pointer; position:relative;
    transition:background 0.2s; flex-shrink:0;
    border:none; padding:0;
  }
  .toggle-thumb {
    position:absolute; top:3px;
    width:20px; height:20px; border-radius:50%;
    background:#fff; box-shadow:0 1px 4px rgba(0,0,0,0.2);
    transition:left 0.2s cubic-bezier(.22,1,.36,1);
  }

  .danger-btn {
    width:100%; padding:14px 16px;
    border:none; background:none;
    font-family:'Sora',sans-serif;
    display:flex; align-items:center; gap:12px;
    cursor:pointer; transition:background 0.12s;
    text-align:left;
  }
  .danger-btn:hover  { background:#FFF5F5; }
  .danger-btn:active { background:#FFEBEE; }

  .modal-overlay {
    position:fixed; inset:0; z-index:300;
    background:rgba(13,18,38,0.55);
    display:flex; align-items:flex-end;
    animation:fadeIn 0.18s ease;
  }
  .modal-sheet {
    background:#fff; border-radius:22px 22px 0 0;
    width:100%; padding:28px 24px 40px;
    animation:fadeSlideUp 0.26s cubic-bezier(.22,1,.36,1);
    box-shadow:0 -8px 40px rgba(0,0,0,0.15);
  }

  .nav-btn {
    flex:1; display:flex; flex-direction:column; align-items:center;
    padding:10px 0 12px; gap:4px; cursor:pointer;
    border:none; background:none;
    font-family:'Sora',sans-serif; font-size:10px; font-weight:500;
    transition:color 0.15s;
  }

  .edit-input {
    width:100%; padding:12px 14px;
    border:1.5px solid #E2E6F3; border-radius:10px;
    font-family:'Sora',sans-serif; font-size:14px; color:#0D1226;
    background:#F0F2F8; outline:none;
    transition:border-color 0.15s, box-shadow 0.15s;
  }
  .edit-input:focus {
    border-color:#2347F5;
    box-shadow:0 0 0 3px rgba(35,71,245,0.10);
    background:#fff;
  }
`;

// â”€â”€â”€ Toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Toggle({ on, onChange }) {
  return (
    <button className="toggle-track"
      style={{ background: on ? t.blue : "#D1D5E8" }}
      onClick={e => { e.stopPropagation(); onChange(!on); }}
    >
      <div className="toggle-thumb" style={{ left: on ? 23 : 3 }} />
    </button>
  );
}

// â”€â”€â”€ Section wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Section({ label, children, style = {} }) {
  return (
    <div style={{ margin: "0 16px 14px", ...style }}>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>
          {label}
        </div>
      )}
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: t.border, margin: "0 16px" }} />;
}

// â”€â”€â”€ Row variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function NavRow({ icon, label, sub, badge, badgeColor, badgeBg, onClick }) {
  return (
    <div className="settings-row" onClick={onClick}>
      {icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: icon.bg || t.bluePale,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginRight: 12,
        }}>
          {icon.el}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{sub}</div>}
      </div>
      {badge && (
        <span style={{
          background: badgeBg || t.bluePale, color: badgeColor || t.blue,
          borderRadius: 6, fontSize: 10, fontWeight: 700,
          padding: "3px 8px", marginRight: 8, letterSpacing: "0.04em",
        }}>{badge}</span>
      )}
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M9 18l6-6-6-6" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function ToggleRow({ icon, label, sub, value, onChange }) {
  return (
    <div className="settings-row" style={{ cursor: "default" }}>
      {icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: icon.bg || t.bluePale,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginRight: 12,
        }}>
          {icon.el}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{sub}</div>}
      </div>
      <Toggle on={value} onChange={onChange} />
    </div>
  );
}

// â”€â”€â”€ Profile Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProfileCard({ name, phone, storeId, plan, onEdit }) {
  return (
    <div style={{ margin: "16px 16px 14px" }}>
      <div style={{
        background: `linear-gradient(135deg, #1a38e8 0%, #3a5bff 100%)`,
        borderRadius: 20, padding: "20px",
        position: "relative", overflow: "hidden",
        color: "#fff",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", right: -30, top: -40, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 20, bottom: -50, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          {/* Avatar monogram */}
          <div style={{
            width: 54, height: 54, borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.3)",
          }}>
            {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{name}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{phone}</div>
          </div>
          <button onClick={onEdit} style={{
            marginLeft: "auto", background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10,
            padding: "6px 12px", color: "#fff", cursor: "pointer",
            fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700,
          }}>Edit</button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px", flex: 1 }}>
            <div style={{ fontSize: 10, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Store ID</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{storeId}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 12px", flex: 1 }}>
            <div style={{ fontSize: 10, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Plan</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{plan}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Edit Profile Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EditProfileModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({ ...profile });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: t.border, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Edit Profile</div>
          <button onClick={onClose} style={{
            background: t.bg, border: "none", borderRadius: "50%",
            width: 30, height: 30, cursor: "pointer", color: t.muted,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700,
          }}>Ã—</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {[
            { key: "name",      label: "Full Name"    },
            { key: "phone",     label: "Phone Number" },
            { key: "storeName", label: "Store Name"   },
            { key: "address",   label: "Store Address"},
          ].map(f => (
            <div key={f.key}>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.muted, marginBottom: 6 }}>{f.label}</div>
              <input
                className="edit-input"
                value={form[f.key] || ""}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <button onClick={() => onSave(form)} style={{
          width: "100%", padding: 16, borderRadius: 14,
          background: t.blue, color: "#fff", border: "none",
          fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15,
          cursor: "pointer", boxShadow: "0 4px 16px rgba(35,71,245,0.3)",
        }}>Save Changes</button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Confirm Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ConfirmModal({ title, message, confirmLabel, confirmColor = t.red, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ paddingTop: 24 }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: t.border, margin: "0 auto 20px" }} />
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: t.redPale, margin: "0 auto 14px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
            <path d="M12 9v4m0 4h.01" stroke={t.red} strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={t.red} strokeWidth="1.8"/>
          </svg>
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.6 }}>{message}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 14, borderRadius: 12,
            background: t.bg, color: t.muted, border: `1.5px solid ${t.border}`,
            fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: 14, borderRadius: 12,
            background: confirmColor, color: "#fff", border: "none",
            fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Nav icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NAV_ITEMS = [
  { id: "home",     label: "HOME"     },
  { id: "customers",label: "CUSTOMERS"},
  { id: "reports",  label: "REPORTS"  },
  { id: "settings", label: "SETTINGS" },
];
function NavIcon({ id }) {
  const s = { stroke:"currentColor", strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round" };
  switch(id) {
    case "home": return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9" {...s}/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" {...s}/></svg>;
    case "customers": return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" {...s}/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" {...s}/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" {...s}/></svg>;
    case "reports": return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" {...s}/><path d="M8 17v-5M12 17V7M16 17v-3" {...s}/></svg>;
    case "settings": return <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" {...s}/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...s}/></svg>;
    default: return null;
  }
}
function BottomNav({ onNavigate }) {
  return (
    <nav style={{ background:"#fff", borderTop:`1px solid ${t.border}`, display:"flex", zIndex:100 }}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} className="nav-btn" onClick={() => onNavigate?.(item.id)}
          style={{ color: item.id === "settings" ? t.blue : t.muted }}>
          <NavIcon id={item.id} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// â”€â”€â”€ Icon helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ic = (el, bg) => ({ el, bg });
const Ic = ({ path, color = t.blue, size = 18 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d={path} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Settings
 * Props:
 *  - profile       { name, phone, storeName, address, storeId, plan }
 *  - onNavigate    {(id) => void}
 *  - onBack        {() => void}
 *  - onLogout      {() => void}
 */
export default function Settings({
  profile: initialProfile = {
    name:      "Ramesh Gupta",
    phone:     "+91 98765 00001",
    storeName: "Gupta Kirana Store",
    address:   "12, Market Road, Nashik, MH",
    storeId:   "GS-ST-4421",
    plan:      "Pro Merchant",
  },
  onNavigate = () => {},
  onBack     = () => {},
  onLogout   = () => {},
}) {
  const [profile,         setProfile]        = useState(initialProfile);
  const [notifications,   setNotifications]  = useState(true);
  const [smsAlerts,       setSmsAlerts]      = useState(false);
  const [biometric,       setBiometric]      = useState(true);
  const [darkMode,        setDarkMode]       = useState(() => {
    try {
      return localStorage.getItem("gramsync_dark") === "true";
    } catch {
      return false;
    }
  });
  const [language,        setLanguage]       = useState("English");
  const [modal,           setModal]          = useState(null); // null | "editProfile" | "logout" | "clearData" | "deleteAccount"
  const [shown,           setShown]          = useState(false);

  // Entrance animation
  useEffect(() => {
    const id = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("gramsync_dark", darkMode ? "true" : "false");
      document.body.classList.toggle("dark-mode", darkMode);
    } catch {
      // Ignore storage failures
    }
  }, [darkMode]);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{
        width: "100%", maxWidth: 420, minHeight: "100dvh",
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
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.text }}>Settings</div>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1, overflowY: "auto", paddingTop: 6, paddingBottom: 24,
          opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}>

          {/* Profile card */}
          <ProfileCard
            name={profile.name}
            phone={profile.phone}
            storeId={profile.storeId}
            plan={profile.plan}
            onEdit={() => setModal("editProfile")}
          />

          {/* Store */}
          <Section label="Store">
            <NavRow
              icon={ic(<Ic path="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />, t.bluePale)}
              label={profile.storeName}
              sub={profile.address}
              onClick={() => setModal("editProfile")}
            />
            <Divider />
            <NavRow
              icon={ic(<Ic path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />, t.bluePale)}
              label="Credit Limits"
              sub="Set per-customer borrowing limits"
              onClick={() => {}}
            />
            <Divider />
            <NavRow
              icon={ic(<Ic path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />, t.bluePale)}
              label="Staff Accounts"
              sub="Manage who can access this store"
              badge="PRO"
              badgeBg="#EEF1FF"
              badgeColor={t.blue}
              onClick={() => {}}
            />
          </Section>

          {/* Notifications */}
          <Section label="Notifications">
            <ToggleRow
              icon={ic(<Ic path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />, "#FFF0E5")}
              label="Push Notifications"
              sub="Alerts for payments and credits"
              value={notifications}
              onChange={setNotifications}
            />
            <Divider />
            <ToggleRow
              icon={ic(<Ic path="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" color={t.orange} />, "#FFF0E5")}
              label="SMS Alerts"
              sub="Send payment reminders via SMS"
              value={smsAlerts}
              onChange={setSmsAlerts}
            />
          </Section>

          {/* Security */}
          <Section label="Security">
            <ToggleRow
              icon={ic(<Ic path="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" color={t.green} />, t.greenPale)}
              label="Biometric Login"
              sub="Use fingerprint or Face ID"
              value={biometric}
              onChange={setBiometric}
            />
            <Divider />
            <NavRow
              icon={ic(<Ic path="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" color={t.green} />, t.greenPale)}
              label="Change PIN"
              sub="Update your 4-digit access PIN"
              onClick={() => {}}
            />
            <Divider />
            <NavRow
              icon={ic(<Ic path="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" color={t.green} />, t.greenPale)}
              label="Two-Factor Auth"
              sub="Extra security for your account"
              badge="ON"
              badgeBg={t.greenPale}
              badgeColor={t.green}
              onClick={() => {}}
            />
          </Section>

          {/* Preferences */}
          <Section label="Preferences">
            <NavRow
              icon={ic(<Ic path="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />, t.bluePale)}
              label="Language"
              sub={language}
              onClick={() => {}}
            />
            <Divider />
            <ToggleRow
              icon={ic(<Ic path="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />, t.bluePale)}
              label="Dark Mode"
              sub="Switch to dark theme"
              value={darkMode}
              onChange={setDarkMode}
            />
            <Divider />
            <NavRow
              icon={ic(<Ic path="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />, t.bluePale)}
              label="Export Data"
              sub="Download transactions as PDF/CSV"
              onClick={() => {}}
            />
          </Section>

          {/* Support & About */}
          <Section label="Support">
            <NavRow
              icon={ic(<Ic path="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, t.bluePale)}
              label="Help & FAQ"
              sub="Common questions answered"
              onClick={() => {}}
            />
            <Divider />
            <NavRow
              icon={ic(<Ic path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />, t.bluePale)}
              label="Contact Support"
              sub="support@gramsync.in"
              onClick={() => {}}
            />
            <Divider />
            <NavRow
              icon={ic(<Ic path="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />, "#FFF8E5")}
              label="Rate GramSync"
              sub="Share your experience"
              onClick={() => {}}
            />
            <Divider />
            <div className="settings-row" style={{ cursor: "default" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: t.bg,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 12,
              }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke={t.muted} strokeWidth="1.8"/>
                  <path d="M12 8v4m0 4h.01" stroke={t.muted} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>App Version</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>v2.4.1 (build 441) Â· Up to date</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.green, background: t.greenPale, borderRadius: 6, padding: "3px 8px" }}>
                Latest
              </span>
            </div>
          </Section>

          {/* Danger zone */}
          <div style={{ margin: "0 16px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>
              Account
            </div>
            <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <button className="danger-btn" onClick={() => setModal("logout")}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF8E5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke={t.yellow} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Log Out</div>
                  <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>Sign out of this device</div>
                </div>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div style={{ height: 1, background: t.border, margin: "0 16px" }} />
              <button className="danger-btn" onClick={() => setModal("clearData")}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke={t.orange} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Clear Local Data</div>
                  <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>Remove cached data from this device</div>
                </div>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div style={{ height: 1, background: t.border, margin: "0 16px" }} />
              <button className="danger-btn" onClick={() => setModal("deleteAccount")}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.redPale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" stroke={t.red} strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.red }}>Delete Account</div>
                  <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>Permanently remove all your data</div>
                </div>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "8px 0 4px", fontSize: 11, color: t.muted }}>
            GramSync Merchant Â· v2.4.1 Â· Â© 2024 GramSync Technologies
          </div>
          <div style={{ height: 12 }} />
        </div>

        <BottomNav onNavigate={onNavigate} />

        {/* Modals */}
        {modal === "editProfile" && (
          <EditProfileModal
            profile={profile}
            onSave={p => { setProfile(prev => ({ ...prev, ...p })); setModal(null); }}
            onClose={() => setModal(null)}
          />
        )}
        {modal === "logout" && (
          <ConfirmModal
            title="Log Out?"
            message="You'll need to sign in again to access your merchant account."
            confirmLabel="Log Out"
            confirmColor={t.yellow}
            onConfirm={() => { setModal(null); onLogout(); }}
            onClose={() => setModal(null)}
          />
        )}
        {modal === "clearData" && (
          <ConfirmModal
            title="Clear Local Data?"
            message="This will remove all offline-cached data. Synced transactions are safe in the cloud."
            confirmLabel="Clear Data"
            confirmColor={t.orange}
            onConfirm={() => setModal(null)}
            onClose={() => setModal(null)}
          />
        )}
        {modal === "deleteAccount" && (
          <ConfirmModal
            title="Delete Account?"
            message="This is permanent and cannot be undone. All your store data, customers, and transactions will be erased."
            confirmLabel="Delete Forever"
            confirmColor={t.red}
            onConfirm={() => setModal(null)}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    </>
  );
}




