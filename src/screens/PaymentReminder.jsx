// PaymentReminder.jsx
// Send reminder to a customer

import { useMemo, useState } from "react";

const t = {
  bg: "#F0F2F8",
  card: "#FFFFFF",
  text: "#0D1226",
  muted: "#6C7487",
  blue: "#2347F5",
  green: "#0BAF60",
  red: "#E8304A",
  border: "#E3E7F2",
};

export default function PaymentReminder({
  customer,
  storeName,
  onBack,
  onNavigate,
  onSent,
}) {
  const [channel, setChannel] = useState("WhatsApp");
  const [note, setNote] = useState("");

  const name = customer?.name || "Customer";
  const balance = customer?.balance ?? 0;
  const daysOverdue = customer?.daysOverdue ?? 0;

  const message = useMemo(() => {
    const amount = typeof balance === "number" ? `₹${balance.toLocaleString("en-IN")}` : "your balance";
    const days = daysOverdue ? ` (${daysOverdue} days overdue)` : "";
    return `Hi ${name}, this is a gentle reminder from ${storeName || "our store"} about ${amount}${days}. Please pay at your earliest convenience.`;
  }, [name, balance, daysOverdue, storeName]);

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            border: "none",
            background: t.card,
            borderRadius: 10,
            padding: "8px 10px",
            boxShadow: "0 4px 12px rgba(13,18,38,0.08)",
            fontWeight: 700,
          }}
        >
          Back
        </button>
        <div style={{ fontWeight: 800, fontSize: 18, color: t.text }}>Payment Reminder</div>
      </div>

      <div style={{ padding: "0 18px" }}>
        <div style={{
          background: t.card,
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 10px 24px rgba(13,18,38,0.08)",
        }}>
          <div style={{ fontSize: 13, color: t.muted }}>Customer</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{name}</div>
          <div style={{ marginTop: 6, color: t.muted, fontSize: 13 }}>
            Balance: ₹{Number(balance || 0).toLocaleString("en-IN")}
          </div>
          {daysOverdue ? (
            <div style={{ marginTop: 4, color: t.red, fontSize: 12, fontWeight: 700 }}>
              {daysOverdue} days overdue
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ padding: "14px 18px 0" }}>
        <div style={{ color: t.muted, fontSize: 12, marginBottom: 6 }}>Channel</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["WhatsApp", "SMS"].map((opt) => (
            <button
              key={opt}
              onClick={() => setChannel(opt)}
              style={{
                flex: 1,
                border: "1px solid " + (channel === opt ? t.blue : t.border),
                background: channel === opt ? t.blue : t.card,
                color: channel === opt ? "#fff" : t.text,
                borderRadius: 12,
                padding: "10px 12px",
                fontWeight: 700,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 18px 0" }}>
        <div style={{ color: t.muted, fontSize: 12, marginBottom: 6 }}>Message Preview</div>
        <div style={{
          background: t.card,
          borderRadius: 14,
          padding: 12,
          border: "1px dashed " + t.border,
          fontSize: 13,
          color: t.text,
          lineHeight: 1.4,
        }}>
          {message}
        </div>
      </div>

      <div style={{ padding: "14px 18px 0" }}>
        <div style={{ color: t.muted, fontSize: 12, marginBottom: 6 }}>Add a note (optional)</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: Please pay by Friday to avoid extra fees."
          rows={3}
          style={{
            width: "100%",
            borderRadius: 12,
            border: "1px solid " + t.border,
            padding: 10,
            fontSize: 13,
            resize: "none",
          }}
        />
      </div>

      <div style={{ padding: 18, marginTop: "auto" }}>
        <button
          onClick={() => onSent && onSent({ channel, note, customer })}
          style={{
            width: "100%",
            background: t.green,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "12px 16px",
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          Send via {channel}
        </button>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button
            onClick={() => onNavigate && onNavigate("customers")}
            style={{
              flex: 1,
              background: t.card,
              border: "1px solid " + t.border,
              borderRadius: 12,
              padding: "10px 12px",
              fontWeight: 700,
            }}
          >
            Customers
          </button>
          <button
            onClick={() => onNavigate && onNavigate("home")}
            style={{
              flex: 1,
              background: t.blue,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 12px",
              fontWeight: 700,
            }}
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
