import { useEffect, type ReactNode } from "react";
import { Money } from "./Money";
import type { Category } from "../lib/db";

const CAT_COLORS: Record<Category, string> = {
  Food: "#c8842b",
  Transportation: "#2f7d6b",
  Leisure: "#7b1e23",
  Subscription: "#5b6ea8",
  Groceries: "#4f9c52",
  Other: "#8a7a5e",
};

export function CategoryRow({
  label,
  category,
  spent,
  budget,
}: {
  label: string;
  category: Category;
  spent: number;
  budget: number;
}) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : spent > 0 ? 100 : 0;
  const over = spent > budget && budget > 0;
  return (
    <div className="catrow">
      <div className="catrow__top">
        <span className="catrow__dot" style={{ background: CAT_COLORS[category] }} />
        <span className="catrow__label">{label}</span>
        <span className="catrow__amt">
          <Money amount={spent} size={13} /> <span className="catrow__of">/ </span>
          <Money amount={budget} size={13} muted />
        </span>
      </div>
      <div className="catrow__track">
        <div
          className="catrow__fill"
          style={{
            width: `${pct}%`,
            background: over ? "var(--accent)" : CAT_COLORS[category],
          }}
        />
      </div>
    </div>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  // Fill is written for LTR; RTL is handled by CSS transform on the track.
  return (
    <div className="slider">
      <div className="slider__track">
        <div className="slider__fill" style={{ width: `${pct}%` }} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuenow={value}
      />
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet__scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet__grab" />
        {title && <h3 className="sheet__title">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          className={"seg__opt" + (o.value === value ? " seg__opt--on" : "")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
