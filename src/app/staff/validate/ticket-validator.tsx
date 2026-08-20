"use client";

import { useState } from "react";
import { ScanLine, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { validateTicketAction } from "@/lib/actions/tickets";

type ValidationResult =
  | { state: "IDLE" }
  | { state: "CHECKING" }
  | { state: "VALID"; ref: string }
  | { state: "ALREADY_USED"; ref: string }
  | { state: "INVALID" }
  | { state: "ERROR"; message: string };

export function TicketValidator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ValidationResult>({ state: "IDLE" });

  const validate = async (raw: string) => {
    if (!raw.trim()) return;
    setResult({ state: "CHECKING" });

    const outcome = await validateTicketAction(raw);
    if (!outcome.ok) {
      setResult({ state: "ERROR", message: outcome.error });
      return;
    }
    setResult(outcome);
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
          disabled={result.state === "CHECKING"}
          className="rounded-md bg-marquee-gold px-4 py-2.5 text-sm font-semibold text-bg hover:brightness-110 transition disabled:opacity-50"
        >
          Check
        </button>
      </form>

      <p className="text-xs text-text-muted mb-6">
        Scan a ticket QR, or type its booking ID by hand — e.g.{" "}
        <span className="font-mono text-text-primary">CX8F92K1</span>.
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
      {result.state === "ERROR" && (
        <ResultCard
          icon={<XCircle className="h-10 w-10 text-velvet-red-bright" />}
          title="COULD NOT VALIDATE"
          detail={result.message}
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
