"use client";

import { useState } from "react";

const MONTHLY_AD_BUDGET = 300;

export default function MarginCalculator({
  initialCost,
}: {
  /** Supplier cost in dollars. Use `null` when the matcher didn't surface a price. */
  initialCost: number | null;
}) {
  const [open, setOpen] = useState(false);
  const startingCost = initialCost ?? 10;
  const [cost, setCost] = useState(startingCost);
  const [sellPrice, setSellPrice] = useState(
    Number((startingCost * 3).toFixed(2)),
  );
  const [adCost, setAdCost] = useState(5);
  const [shipping, setShipping] = useState(3);

  const net = sellPrice - cost - adCost - shipping;
  const margin = sellPrice > 0 ? (net / sellPrice) * 100 : 0;
  const breakeven =
    net > 0 ? Math.ceil(MONTHLY_AD_BUDGET / net) : Infinity;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition self-start cursor-pointer"
      >
        Estimate margin →
      </button>
    );
  }

  return (
    <div className="mt-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-[var(--color-text)]">
          Margin estimate
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition cursor-pointer"
        >
          Hide
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Cost" value={cost} onChange={setCost} />
        <Field label="Sell price" value={sellPrice} onChange={setSellPrice} />
        <Field label="Ad / unit" value={adCost} onChange={setAdCost} />
        <Field label="Shipping" value={shipping} onChange={setShipping} />
      </div>

      <div className="border-t border-[var(--color-border)] pt-3 space-y-1.5">
        <Result
          label="Net per unit"
          value={formatCurrency(net)}
          tone={net > 0 ? "good" : "bad"}
        />
        <Result
          label="Gross margin"
          value={`${margin.toFixed(0)}%`}
          tone={margin >= 30 ? "good" : margin >= 10 ? "neutral" : "bad"}
        />
        <Result
          label={`Breakeven @ $${MONTHLY_AD_BUDGET}/mo`}
          value={
            Number.isFinite(breakeven) && breakeven > 0
              ? `${breakeven} unit${breakeven === 1 ? "" : "s"}`
              : "—"
          }
          tone="neutral"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-faint)]">
        {label}
      </span>
      <div className="flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] focus-within:border-[var(--color-accent)] transition">
        <span className="pl-2 text-[var(--color-text-faint)]">$</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          className="w-full bg-transparent text-[var(--color-text)] py-1 pl-1 pr-2 text-xs outline-none"
        />
      </div>
    </label>
  );
}

function Result({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "neutral" | "bad";
}) {
  const valueClass =
    tone === "good"
      ? "text-[var(--color-accent)]"
      : tone === "bad"
        ? "text-red-400"
        : "text-[var(--color-text)]";
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
