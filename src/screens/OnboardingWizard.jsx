// OnboardingWizard.jsx
// Simple first-run setup flow

import { useState } from "react";

const t = {
  bg: "#F0F2F8",
  card: "#FFFFFF",
  text: "#0D1226",
  muted: "#6C7487",
  blue: "#2347F5",
  bluePale: "#EEF1FF",
};

export default function OnboardingWizard({ onComplete, onSkip }) {
  const [storeName, setStoreName] = useState("Sharma Kirana Store");
  const [ownerName, setOwnerName] = useState("Amit Sharma");
  const [city, setCity] = useState("Jaipur");

  const handleComplete = () => {
    if (!onComplete) return;
    onComplete({
      storeName: storeName.trim() || "My Store",
      ownerName: ownerName.trim() || "Owner",
      city: city.trim() || "City",
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.text }}>Welcome to GramSync</div>
        <div style={{ color: t.muted, marginTop: 6, fontSize: 14 }}>
          Let&apos;s personalize your store in two quick steps.
        </div>
      </div>

      <div style={{ padding: "0 22px" }}>
        <div style={{
          background: t.card,
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 12px 30px rgba(13,18,38,0.08)",
        }}>
          <label style={{ fontSize: 12, color: t.muted }}>Store Name</label>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #E3E7F2",
              fontSize: 14,
            }}
          />

          <label style={{ fontSize: 12, color: t.muted }}>Owner Name</label>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #E3E7F2",
              fontSize: 14,
            }}
          />

          <label style={{ fontSize: 12, color: t.muted }}>City</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #E3E7F2",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      <div style={{ padding: 22, marginTop: "auto" }}>
        <button
          onClick={handleComplete}
          style={{
            width: "100%",
            background: t.blue,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "12px 16px",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Finish Setup
        </button>
        <button
          onClick={onSkip}
          style={{
            width: "100%",
            marginTop: 10,
            background: t.bluePale,
            color: t.blue,
            border: "none",
            borderRadius: 12,
            padding: "10px 16px",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
