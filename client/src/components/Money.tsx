import type { CSSProperties } from "react";
import { Rial } from "./Rial";

/**
 * The rial divides into 1000 baisa, so all amounts show exactly 3 decimals.
 * We format with Western digits regardless of language (finance apps in Oman
 * conventionally use Western numerals for money), but the symbol side flips
 * with direction so it sits correctly in RTL.
 */
export function formatOMR(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return safe.toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function Money({
  amount,
  size = "1em",
  bold,
  muted,
  style,
}: {
  amount: number;
  size?: number | string;
  bold?: boolean;
  muted?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      className="money"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.28em",
        fontVariantNumeric: "tabular-nums",
        fontWeight: bold ? 700 : 500,
        opacity: muted ? 0.55 : 1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <Rial size={size} />
      <span style={{ fontSize: size }}>{formatOMR(amount)}</span>
    </span>
  );
}
