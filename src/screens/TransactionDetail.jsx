// TransactionDetail.jsx
// Detailed transaction screen (hero card + actions + details + related list)

const t = {
  bg: "#F0F2F8",
  card: "#FFFFFF",
  text: "#0D1226",
  muted: "#7A85A3",
  blue: "#2347F5",
  blueDark: "#2F43D6",
  blueMid: "#3A5BFF",
  green: "#0BAF60",
  greenPale: "#E6F9F0",
  orange: "#F56A00",
  orangePale: "#FFF0E5",
  red: "#E8304A",
  border: "#E3E7F2",
};

function IconButton({ onClick, bg, color, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        border: "none",
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function ActionTile({ label, color, bg, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: bg,
        border: "none",
        borderRadius: 16,
        padding: "16px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
      }}
    >
      <div style={{
        width: 34,
        height: 34,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        background: "#fff",
        boxShadow: "0 2px 6px rgba(13,18,38,0.08)",
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color }}>
        {label}
      </div>
    </button>
  );
}

function DetailRow({ label, value, valueColor }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 2px",
      borderBottom: `1px solid ${t.border}`,
    }}>
      <div style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: valueColor || t.text, textAlign: "right" }}>
        {value}
      </div>
    </div>
  );
}

export default function TransactionDetail({
  transaction,
  storeName,
  onBack,
  onNavigate,
  onUpdate,
  onDelete,
  onReminder,
  onTxnPress,
}) {
  const txn = transaction || {
    id: "TXN-28441",
    customer: { name: "Customer", initials: "CU", phone: "+91 98765 43210" },
    amount: 0,
    type: "udhar",
    time: new Date(),
    note: "Bulk Grain Purchase",
    category: "Groceries",
    status: "PENDING",
  };

  const isCredit = String(txn.type || "").toLowerCase() === "udhar";
  const rawAmount = txn.amount;
  const amountNumber = typeof rawAmount === "string"
    ? parseFloat(rawAmount.replace(/,/g, ""))
    : Number(rawAmount || 0);
  const timeValue = txn.time ? new Date(txn.time) : null;
  const timeLabel = timeValue && !Number.isNaN(timeValue.getTime())
    ? timeValue.toLocaleString([], { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })
    : (txn.time || "Today, 10:45 AM");

  const customerName = txn.customer?.name || txn.name || "Customer";
  const customerInitials = txn.customer?.initials || txn.initials || customerName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  const customerPhone = txn.customer?.phone || "+91 98765 43210";
  const txnId = txn.id || "TXN-28441";
  const statusLabel = String(txn.status || "PENDING").toUpperCase();
  const statusColor = statusLabel === "SYNCED" ? t.green : t.orange;
  const statusBg = statusLabel === "SYNCED" ? t.greenPale : t.orangePale;

  const related = [
    { id: 1, label: "Payment Received", time: "Today, 08:20 AM", amount: "+₹200", color: t.green, icon: "↓" },
    { id: 2, label: "Grocery Items", time: "Yesterday, 6:00 PM", amount: "-₹500", color: t.orange, icon: "↑" },
    { id: 3, label: "Partial Payment", time: "12 Oct, 11:30 AM", amount: "+₹750", color: t.green, icon: "↓" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <div style={{
        padding: "16px 18px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#fff",
        borderBottom: `1px solid ${t.border}`,
      }}>
        <button
          onClick={onBack}
          style={{
            border: "none",
            background: "#fff",
            padding: 4,
            cursor: "pointer",
          }}
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: t.text }}>Transaction Detail</div>
          <div style={{ fontSize: 11, color: t.muted }}>View & manage this entry</div>
        </div>
        <button
          onClick={() => onUpdate && onUpdate(txn)}
          style={{
            border: "none",
            background: "#EEF1FF",
            color: t.blue,
            padding: "8px 12px",
            borderRadius: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Edit
        </button>
        <IconButton onClick={() => onDelete && onDelete(txnId)} bg="#FFECEF" color={t.red}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M3 6h18M9 6V4h6v2M8 6l1 14h6l1-14" stroke={t.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </IconButton>
      </div>

      <div style={{ padding: "18px 16px 8px" }}>
        {/* Hero card */}
        <div style={{
          background: `linear-gradient(140deg, ${t.blue} 0%, ${t.blueMid} 100%)`,
          color: "#fff",
          borderRadius: 20,
          padding: "20px 18px",
          boxShadow: "0 18px 36px rgba(35,71,245,0.22)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            right: -30,
            top: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }} />
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.8 }}>
            {isCredit ? "UdhAR — Credit Given" : "Payment Received"}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            {"\u20B9"}{Math.abs(amountNumber || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600 }}>
            {txn.note || "Bulk Grain Purchase"}
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.18)", margin: "14px 0" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}>
                {customerInitials}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{customerName}</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>GS-9982</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{timeLabel}</div>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>#{txnId}</div>
            </div>
          </div>
        </div>

        {/* Action tiles */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <ActionTile
            label="Edit"
            color={t.blue}
            bg="#F3F5FF"
            onClick={() => onUpdate && onUpdate(txn)}
            icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16v4z" stroke={t.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          />
          <ActionTile
            label="Share"
            color={t.green}
            bg="#F3FBF7"
            onClick={() => {}}
            icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7-7 7 7" stroke={t.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          />
          <ActionTile
            label="Remind"
            color={t.orange}
            bg="#FFF6EF"
            onClick={() => onReminder && onReminder(txn.customer)}
            icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1.1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1" stroke={t.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          />
          <ActionTile
            label="Mark Paid"
            color={t.green}
            bg="#ECFAF2"
            onClick={() => {}}
            icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke={t.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          />
        </div>

        {/* Details card */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "10px 16px 4px",
          marginTop: 16,
          boxShadow: "0 2px 10px rgba(13,18,38,0.06)",
        }}>
          <DetailRow label="Transaction ID" value={`#${txnId}`} />
          <DetailRow label="Customer" value={customerName} />
          <DetailRow label="Phone" value={customerPhone} />
          <DetailRow label="Store" value={storeName || "Sharma Kirana Store"} />
          <DetailRow label="Type" value={isCredit ? "Udhar (Credit Given)" : "Payment (Received)"} />
          <DetailRow
            label="Status"
            value={
              <span style={{
                background: statusBg,
                color: statusColor,
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.04em",
              }}>
                {statusLabel}
              </span>
            }
          />
          <DetailRow label="Created" value={timeLabel} />
          <DetailRow label="Note" value={txn.note || "No note added"} valueColor={txn.note ? t.text : t.muted} />
          <DetailRow label="Category" value={txn.category || "Groceries"} />
        </div>

        {/* Pending sync card */}
        <div style={{
          background: "#fff",
          borderRadius: 14,
          padding: "12px 14px",
          marginTop: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 8px rgba(13,18,38,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#FFF6EF",
              color: t.orange,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}>
              ↻
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Pending sync</div>
              <div style={{ fontSize: 11, color: t.muted }}>Will upload when connected</div>
            </div>
          </div>
          <button style={{
            background: "#EEF1FF",
            color: t.blue,
            border: "none",
            borderRadius: 10,
            padding: "6px 12px",
            fontWeight: 700,
            cursor: "pointer",
          }}>
            Retry
          </button>
        </div>

        {/* Related transactions */}
        <div style={{ marginTop: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 10 }}>
            Other transactions with {customerName.split(" ")[0]}
          </div>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            padding: "8px 10px",
            boxShadow: "0 1px 8px rgba(13,18,38,0.05)",
          }}>
            {related.map((item, i) => (
              <div
                key={item.id}
                onClick={() => onTxnPress && onTxnPress(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 6px",
                  borderBottom: i < related.length - 1 ? `1px solid ${t.border}` : "none",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: item.color === t.green ? t.greenPale : t.orangePale,
                    color: item.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>{item.time}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.amount}</div>
                  <div style={{ fontSize: 10, color: t.green, fontWeight: 700 }}>✓ SYNCED</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav shortcut */}
      <div style={{ padding: "0 16px 18px" }}>
        <button
          onClick={() => onNavigate && onNavigate("home")}
          style={{
            width: "100%",
            background: t.blueDark,
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "12px 14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
