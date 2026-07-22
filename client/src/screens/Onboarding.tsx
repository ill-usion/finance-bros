import { useState } from "react";
import { useStore, useT } from "../lib/store";
import { NumPad } from "../components/NumPad";
import { Slider } from "../components/UI";
import { Money } from "../components/Money";
import { CategoryRow } from "../components/UI";
import { analyzeSpending, type AnalysisStatus } from "../lib/api";
import { CATEGORIES, type Category, type Profile } from "../lib/db";
import { dailyLimit, weeklySaved } from "../lib/budget";

type Step = "income" | "budget" | "savings" | "statement" | "forecast";

const GUIDE_KEYS = [
  { t: "guide_1_t", b: "guide_1_b" },
  { t: "guide_2_t", b: "guide_2_b" },
  { t: "guide_3_t", b: "guide_3_b" },
  { t: "guide_4_t", b: "guide_4_b" },
];

export function Onboarding() {
  const { settings, completeOnboarding } = useStore();
  const t = useT();

  const [step, setStep] = useState<Step>("income");
  const [income, setIncome] = useState("");
  const [budget, setBudget] = useState("");
  const [savings, setSavings] = useState(10);

  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [guideIdx, setGuideIdx] = useState(0);
  const [forecast, setForecast] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [suggested, setSuggested] = useState<number | null>(null);

  const incomeN = parseFloat(income) || 0;
  const budgetN = parseFloat(budget) || 0;
  const proxy = { weeklyBudget: budgetN, savingPercentage: savings };

  const runAnalysis = async (file: File) => {
    setStatus("parsing");
    const res = await analyzeSpending(
      {
        monthlyIncome: incomeN,
        weeklyBudget: budgetN,
        savingPercentage: savings,
        language: settings.language,
        file,
      },
      (s) => setStatus(s)
    );
    if (res) {
      setForecast(res.forecast ?? []);
      setScore(res.score);
      setReasoning(res.score_reasoning);
      setSuggested(res.suggested_weekly_budget);
    } else {
      setScore(null);
    }
    setStatus("done");
    setStep("forecast");
  };

  const finish = async () => {
    const p: Profile = {
      monthlyIncome: incomeN,
      weeklyBudget: budgetN,
      savingPercentage: savings,
      forecast,
      score: score ?? undefined,
      scoreReasoning: reasoning || undefined,
      createdAt: new Date().toISOString(),
    };
    await completeOnboarding(p);
  };

  // ---- income ----
  if (step === "income")
    return (
      <NumStep
        eyebrow={t("step") + " 1 " + t("of") + " 3"}
        title={t("income_q")}
        hint={t("income_hint")}
        value={income}
        setValue={setIncome}
        canNext={incomeN > 0}
        onNext={() => setStep("budget")}
        nextLabel={t("continue")}
      />
    );

  // ---- budget ----
  if (step === "budget")
    return (
      <NumStep
        eyebrow={t("step") + " 2 " + t("of") + " 3"}
        title={t("budget_q")}
        hint={t("budget_hint")}
        value={budget}
        setValue={setBudget}
        canNext={budgetN > 0}
        onNext={() => setStep("savings")}
        onBack={() => setStep("income")}
        nextLabel={t("continue")}
      />
    );

  // ---- savings ----
  if (step === "savings") {
    const daily = dailyLimit(proxy);
    const saved = weeklySaved(proxy);
    return (
      <div className="screen rise">
        <div className="eyebrow">{t("step")} 3 {t("of")} 3</div>
        <h1 className="title">{t("savings_q")}</h1>
        <p className="subtitle">{t("savings_hint")}</p>

        <div className="card" style={{ padding: 22, marginTop: 6 }}>
          <div style={{ textAlign: "center", fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 800, color: "var(--accent)" }}>
            {savings}%
          </div>
          <Slider value={savings} min={0} max={50} onChange={setSavings} />
        </div>

        <div className="row between" style={{ marginTop: 8, gap: 12 }}>
          <div className="card stat">
            <div className="stat__label">{t("daily_spend")}</div>
            <Money amount={daily} size={20} bold />
          </div>
          <div className="card stat">
            <div className="stat__label">{t("saved_weekly")}</div>
            <Money amount={saved} size={20} bold style={{ color: "var(--good)" }} />
          </div>
        </div>

        <div className="spacer" />
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn--ghost" onClick={() => setStep("budget")}>{t("back")}</button>
          <button className="btn btn--primary btn--block" onClick={() => setStep("statement")}>{t("continue")}</button>
        </div>
      </div>
    );
  }

  // ---- statement + guide ----
  if (step === "statement") {
    const g = GUIDE_KEYS[guideIdx];
    const statusText =
      status === "parsing" ? t("status_parsing")
      : status === "forecasting" ? t("status_forecasting")
      : status === "reviewing" ? t("status_reviewing")
      : status === "error" ? t("status_done")
      : t("analyzing");

    return (
      <div className="screen rise">
        {!status ? (
          <>
            <div className="eyebrow">{t("appName")}</div>
            <h1 className="title">{t("statement_q")}</h1>
            <p className="subtitle">{t("statement_hint")}</p>
            <div className="spacer" />
            <label className="btn btn--primary btn--block" style={{ cursor: "pointer" }}>
              {t("choose_file")}
              <input
                type="file"
                accept="application/pdf,image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) runAnalysis(f);
                }}
              />
            </label>
            <button className="btn btn--ghost" onClick={() => setStep("savings")}>{t("back")}</button>
          </>
        ) : (
          <>
            <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <span className={"pulse" + (status === "done" ? " pulse--done" : "")} />
              <span style={{ fontWeight: 600 }}>{statusText}</span>
            </div>

            <div className="guide">
              <div className="eyebrow">{t("guide_title")}</div>
              <div className="guide__num">{guideIdx + 1} <span>/ {GUIDE_KEYS.length}</span></div>
              <div className="guide__art">{guideArt(guideIdx)}</div>
              <h2 className="guide__t">{t(g.t)}</h2>
              <p className="subtitle">{t(g.b)}</p>
              <div className="guide__dots">
                {GUIDE_KEYS.map((_, i) => (
                  <span key={i} className={"dot" + (i === guideIdx ? " dot--on" : "")} />
                ))}
              </div>
              <div className="row" style={{ gap: 10 }}>
                <button className="btn btn--ghost" disabled={guideIdx === 0} onClick={() => setGuideIdx((i) => i - 1)}>{t("back")}</button>
                <button
                  className="btn btn--ghost btn--block"
                  disabled={guideIdx === GUIDE_KEYS.length - 1}
                  onClick={() => setGuideIdx((i) => Math.min(i + 1, GUIDE_KEYS.length - 1))}
                >
                  {t("next")}
                </button>
              </div>
            </div>

            <div className="spacer" />
            <button
              className="btn btn--primary btn--block"
              disabled={status !== "done"}
              onClick={() => setStep("forecast")}
            >
              {status === "done" ? t("continue") : statusText + "…"}
            </button>
          </>
        )}
      </div>
    );
  }

  // ---- forecast + rating ----
  const catForecast = distributeForecast(forecast);
  const weekTotal = forecast.reduce((a, b) => a + b, 0);
  return (
    <div className="screen rise">
      <div className="eyebrow">{t("appName")}</div>
      <h1 className="title">{t("forecast_title")}</h1>
      <p className="subtitle">{t("forecast_hint")}</p>

      {score !== null && (
        <div className="card score" style={{ padding: 20 }}>
          <div className="score__ring" style={scoreStyle(score)}>
            <span>{score}</span>
          </div>
          <div>
            <div className="stat__label">{t("your_score")}</div>
            <p style={{ margin: "4px 0 0", fontSize: 15 }}>{reasoning}</p>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        {forecast.length > 0 ? (
          CATEGORIES.map((c) => (
            <CategoryRow key={c} label={t("cat_" + c)} category={c} spent={catForecast[c]} budget={weekTotal / 6 || 1} />
          ))
        ) : (
          <p className="subtitle" style={{ textAlign: "center" }}>{t("no_forecast")}</p>
        )}
      </div>

      {suggested !== null && (
        <div className="row between" style={{ fontSize: 14, color: "var(--text-dim)" }}>
          <span>{t("weekly_budget")}</span>
          <Money amount={suggested} size={14} bold />
        </div>
      )}

      <div className="spacer" />
      <button className="btn btn--primary btn--block" onClick={finish}>{t("continue")}</button>
    </div>
  );
}

function NumStep({
  eyebrow, title, hint, value, setValue, canNext, onNext, onBack, nextLabel,
}: {
  eyebrow: string; title: string; hint: string;
  value: string; setValue: (v: string) => void;
  canNext: boolean; onNext: () => void; onBack?: () => void; nextLabel: string;
}) {
  return (
    <div className="screen rise">
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="title">{title}</h1>
      <p className="subtitle">{hint}</p>
      <div className="spacer" />
      <NumPad value={value} onChange={setValue} />
      <div className="spacer" />
      <div className="row" style={{ gap: 10 }}>
        {onBack && <button className="btn btn--ghost" onClick={onBack}>{"‹"}</button>}
        <button className="btn btn--primary btn--block" disabled={!canNext} onClick={onNext}>{nextLabel}</button>
      </div>
    </div>
  );
}

function scoreStyle(score: number): React.CSSProperties {
  const color = score >= 70 ? "var(--good)" : score >= 45 ? "var(--warn)" : "var(--accent)";
  return {
    background: `conic-gradient(${color} ${score * 3.6}deg, var(--surface-2) 0)`,
  };
}

function distributeForecast(forecast: number[]): Record<Category, number> {
  // The backend returns a daily total series; spread it across categories with
  // a fixed heuristic so the onboarding preview reads clearly. Real per-category
  // data accrues from logged spendings once the app is in use.
  const weights: Record<Category, number> = {
    Food: 0.3, Groceries: 0.22, Transportation: 0.16,
    Leisure: 0.14, Subscription: 0.1, Other: 0.08,
  };
  const total = forecast.reduce((a, b) => a + Math.max(b, 0), 0);
  const out = {} as Record<Category, number>;
  for (const c of CATEGORIES) out[c] = +(total * weights[c]).toFixed(3);
  return out;
}

function guideArt(i: number) {
  const common = { width: 92, height: 92, viewBox: "0 0 92 92", fill: "none" as const };
  const stroke = "var(--accent)";
  if (i === 0)
    return (
      <svg {...common}><circle cx="46" cy="46" r="30" stroke={stroke} strokeWidth="4" /><path d="M46 26v20l14 8" stroke={stroke} strokeWidth="4" strokeLinecap="round" /></svg>
    );
  if (i === 1)
    return (
      <svg {...common}><rect x="24" y="30" width="44" height="34" rx="6" stroke={stroke} strokeWidth="4" /><circle cx="46" cy="47" r="8" stroke={stroke} strokeWidth="4" /><path d="M38 30l4-6h8l4 6" stroke={stroke} strokeWidth="4" /></svg>
    );
  if (i === 2)
    return (
      <svg {...common}><rect x="24" y="46" width="10" height="22" rx="2" stroke={stroke} strokeWidth="4" /><rect x="41" y="34" width="10" height="34" rx="2" stroke={stroke} strokeWidth="4" /><rect x="58" y="24" width="10" height="44" rx="2" stroke={stroke} strokeWidth="4" /></svg>
    );
  return (
    <svg {...common}><circle cx="46" cy="46" r="26" stroke={stroke} strokeWidth="4" /><path d="M46 34v24M40 40h9a5 5 0 010 10h-6a5 5 0 000 10h9" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" /></svg>
  );
}
