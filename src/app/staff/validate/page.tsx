"use client";

import { useState } from "react";
import { ScanLine, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type ValidationResult =
  | { state: "IDLE" }
  | { state: "VALID"; ref: string }
  | { state: "ALREADY_USED"; ref: string }
  | { state: "INVALID" };

// Demo-only in-memory ticket store. Real implementation: look up Ticket by
// qrToken in Postgres, verify Booking/Payment/Showtime status, then in one
// transaction move ACTIVE -> USED (mirrors confirmSeats() in seat-locking.ts —
// a conditional update so a ticket can never be scanned "valid" twice).
const DEMO_TICKETS = new Map<string, "ACTIVE" | "USED">([
  ["CX8F92K1", "ACTIVE"],
  ["CX3K7Q2M", "USED"],
]);

export default function StaffValidatePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ValidationResult>({ state: "IDLE" });

  const validate = (raw: string) => {
    const ref = raw.trim().toUpperCase().replace(/^CINEPASS:TICKET:/, "");
    if (!ref) return;

    const status = DEMO_TICKETS.get(ref);
    if (!status) {
      setResult({ state: "INVALID" });
      return;
    }
    if (status === "USED") {
      setResult({ state: "ALREADY_USED", ref });
      return;
    }
    DEMO_TICKETS.set(ref, "USED");
    setResult({ state: "VALID", ref });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 mb-6">
        <ScanLine className="h-5 w-5 text-marquee-gold" />
        <h1 className="font-display text-2xl tracking-wide">Ticket Validation</h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          validate(input);
        }}
        className="flex gap-2 mb-6"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scan QR or enter booking ID"
          className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2.5 text-sm font-mono text-text-primary placeholder:text-text-muted"
          autoFocus
        />
        <button
          type="submit"
          className="rounded-md bg-marquee-gold px-4 py-2.5 text-sm font-semibold text-bg hover:brightness-110 transition"
        >
          Check
        </button>
      </form>

      <p className="text-xs text-text-muted mb-6">
        Try <span className="font-mono text-text-primary">CX8F92K1</span> (valid) or{" "}
        <span className="font-mono text-text-primary">CX3K7Q2M</span> (already used).
      </p>

      {result.state === "VALID" && (
        <ResultCard
          icon={<CheckCircle2 className="h-10 w-10 text-marquee-gold" />}
          title="VALID TICKET"
          detail={`Booking ${result.ref} admitted. Status updated to USED.`}
          tone="ok"
        />
      )}
      {result.state === "ALREADY_USED" && (
        <ResultCard
          icon={<AlertTriangle className="h-10 w-10 text-velvet-red-bright" />}
          title="TICKET ALREADY USED"
          detail={`Booking ${result.ref} was already admitted.`}
          tone="warn"
        />
      )}
      {result.state === "INVALID" && (
        <ResultCard
          icon={<XCircle className="h-10 w-10 text-velvet-red-bright" />}
          title="INVALID TICKET"
          detail="No booking matches this code."
          tone="warn"
        />
      )}
    </div>
  );
}

function ResultCard({
  icon,
  title,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  tone: "ok" | "warn";
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-lg border p-6 text-center ${
        tone === "ok" ? "border-marquee-gold/60 bg-marquee-gold/5" : "border-velvet-red-bright/60 bg-velvet-red-bright/5"
      }`}
    >
      {icon}
      <p className="font-display text-xl tracking-wide">{title}</p>
      <p className="text-sm text-text-muted">{detail}</p>
    </div>
  );
}
