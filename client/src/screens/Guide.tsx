import { useState } from "react";
import { useT } from "../lib/store";

const KEYS = [
  { t: "guide_1_t", b: "guide_1_b" },
  { t: "guide_2_t", b: "guide_2_b" },
  { t: "guide_3_t", b: "guide_3_b" },
  { t: "guide_4_t", b: "guide_4_b" },
];

export function Guide({ back }: { back: () => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const g = KEYS[i];
  const last = i === KEYS.length - 1;

  return (
    <div className="screen screen--pad-safe rise" style={{ gap: 16 }}>
      <div className="row between">
        <button className="icon-btn" onClick={back}>‹ {t("home")}</button>
        <span className="eyebrow">{t("guide_title")}</span>
      </div>

      <div className="spacer" />
      <div className="guide" style={{ textAlign: "center" }}>
        <div className="guide__num" style={{ justifyContent: "center" }}>{i + 1} <span>/ {KEYS.length}</span></div>
        <div className="guide__art" style={{ margin: "8px auto" }}>{art(i)}</div>
        <h2 className="guide__t">{t(g.t)}</h2>
        <p className="subtitle">{t(g.b)}</p>
      </div>
      <div className="guide__dots" style={{ justifyContent: "center" }}>
        {KEYS.map((_, k) => <span key={k} className={"dot" + (k === i ? " dot--on" : "")} />)}
      </div>
      <div className="spacer" />

      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn--ghost" disabled={i === 0} onClick={() => setI((x) => x - 1)}>{t("back")}</button>
        {last ? (
          <button className="btn btn--primary btn--block" onClick={back}>{t("done")}</button>
        ) : (
          <button className="btn btn--primary btn--block" onClick={() => setI((x) => x + 1)}>{t("next")}</button>
        )}
      </div>
    </div>
  );
}

function art(i: number) {
  const c = { width: 92, height: 92, viewBox: "0 0 92 92", fill: "none" as const };
  const s = "var(--accent)";
  if (i === 0) return <svg {...c}><circle cx="46" cy="46" r="30" stroke={s} strokeWidth="4" /><path d="M46 26v20l14 8" stroke={s} strokeWidth="4" strokeLinecap="round" /></svg>;
  if (i === 1) return <svg {...c}><rect x="24" y="30" width="44" height="34" rx="6" stroke={s} strokeWidth="4" /><circle cx="46" cy="47" r="8" stroke={s} strokeWidth="4" /><path d="M38 30l4-6h8l4 6" stroke={s} strokeWidth="4" /></svg>;
  if (i === 2) return <svg {...c}><rect x="24" y="46" width="10" height="22" rx="2" stroke={s} strokeWidth="4" /><rect x="41" y="34" width="10" height="34" rx="2" stroke={s} strokeWidth="4" /><rect x="58" y="24" width="10" height="44" rx="2" stroke={s} strokeWidth="4" /></svg>;
  return <svg {...c}><circle cx="46" cy="46" r="26" stroke={s} strokeWidth="4" /><path d="M46 34v24M40 40h9a5 5 0 010 10h-6a5 5 0 000 10h9" stroke={s} strokeWidth="3.5" strokeLinecap="round" /></svg>;
}
