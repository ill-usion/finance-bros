import { Money } from "./Money";

/**
 * MEEZAN = balance. The signature element: a scale beam that tilts toward
 * "spent" as you approach and pass your daily limit. At 0% spent it's level;
 * at/over 100% it tips fully. It's the one bold element — everything else stays
 * quiet.
 */
export function ScaleGauge({
  limit,
  spent,
  leftLabel,
  overLabel,
}: {
  limit: number;
  spent: number;
  leftLabel: string;
  overLabel: string;
}) {
  const ratio = limit > 0 ? spent / limit : spent > 0 ? 1 : 0;
  const clamped = Math.max(0, Math.min(ratio, 1.15));
  // tilt: 0 at ratio 0, up to ~14deg at/over 1
  const tilt = Math.min(clamped, 1) * 14;
  const over = spent > limit;
  const remaining = limit - spent;

  const arm = 92;
  const cx = 150;
  const cy = 70;
  const rad = (tilt * Math.PI) / 180;
  const lx = cx - Math.cos(rad) * arm;
  const ly = cy + Math.sin(rad) * arm;
  const rx = cx + Math.cos(rad) * arm;
  const ry = cy - Math.sin(rad) * arm;

  const accent = over ? "var(--accent)" : "var(--good)";

  return (
    <div className="scale">
      <svg viewBox="0 0 300 190" className="scale__svg" role="img" aria-label="Balance of daily limit versus spent">
        {/* pans */}
        <g style={{ transition: "all .6s cubic-bezier(.2,.7,.2,1)" }}>
          <line x1={lx} y1={ly} x2={lx} y2={ly + 26} stroke="var(--border)" strokeWidth="2" />
          <path d={`M ${lx - 26} ${ly + 26} Q ${lx} ${ly + 48} ${lx + 26} ${ly + 26} Z`} fill="var(--good-soft)" stroke="var(--good)" strokeWidth="2" />
          <line x1={rx} y1={ry} x2={rx} y2={ry + 26} stroke="var(--border)" strokeWidth="2" />
          <path d={`M ${rx - 26} ${ry + 26} Q ${rx} ${ry + 48} ${rx + 26} ${ry + 26} Z`} fill={over ? "var(--accent)" : "var(--surface-2)"} stroke={accent} strokeWidth="2" />
          {/* beam */}
          <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="var(--text)" strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* pillar */}
        <line x1={cx} y1={cy} x2={cx} y2={168} stroke="var(--text)" strokeWidth="5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="7" fill="var(--accent)" />
        <path d="M 120 168 Q 150 178 180 168" stroke="var(--text)" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>

      <div className="scale__readout">
        <Money amount={spent} size={30} bold style={{ color: accent }} />
        <div className="scale__sub">
          {over ? (
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>
              {overLabel} <Money amount={Math.abs(remaining)} size={13} />
            </span>
          ) : (
            <span>
              <Money amount={Math.max(remaining, 0)} size={13} /> {leftLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
