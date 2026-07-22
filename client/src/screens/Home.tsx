import { useMemo, useState } from "react";
import { useStore, useT } from "../lib/store";
import { ScaleGauge } from "../components/ScaleGauge";
import { CategoryRow } from "../components/UI";
import { CATEGORIES } from "../lib/db";
import {
  dailyLimit,
  effectiveWeeklyBudget,
  startOfDay,
  startOfWeek,
  sumByCategory,
  total,
} from "../lib/budget";
import { AddSpendSheet } from "./sheets/AddSpendSheet";
import { ExtraIncomeSheet } from "./sheets/ExtraIncomeSheet";
import { AdjustBudgetSheet } from "./sheets/AdjustBudgetSheet";

type Nav = "edit" | "settings" | "guide";

export function Home({ go }: { go: (n: Nav) => void }) {
  const { profile, spendings } = useStore();
  const t = useT();
  const [sheet, setSheet] = useState<null | "add" | "extra" | "adjust">(null);
  const [addSource, setAddSource] = useState<"manual" | "receipt" | "gallery">("manual");

  const { todaySpent, weekByCat, weekBudget } = useMemo(() => {
    const dayStart = startOfDay().toISOString();
    const weekStart = startOfWeek().toISOString();
    const now = new Date().toISOString();
    const today = spendings.filter((s) => s.at >= dayStart && s.at <= now);
    const week = spendings.filter((s) => s.at >= weekStart && s.at <= now);
    return {
      todaySpent: total(today),
      weekByCat: sumByCategory(week),
      weekBudget: profile ? effectiveWeeklyBudget(profile) : 0,
    };
  }, [spendings, profile]);

  if (!profile) return null;
  const limit = dailyLimit(profile);
  const perCatBudget = weekBudget / CATEGORIES.length;

  const openAdd = (src: "manual" | "receipt" | "gallery") => {
    setAddSource(src);
    setSheet("add");
  };

  return (
    <div className="screen screen--pad-safe rise" style={{ gap: 14 }}>
      <div className="row between">
        <div>
          <div className="eyebrow">{t("today")}</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>
            {t("appName")}
          </div>
        </div>
        <button className="icon-btn" aria-label={t("adjust_budget")} onClick={() => setSheet("adjust")}>
          ⚙︎ {t("adjust_budget")}
        </button>
      </div>

      <div className="card" style={{ padding: "18px 16px 20px" }}>
        <ScaleGauge
          limit={limit}
          spent={todaySpent}
          leftLabel={t("left_today")}
          overLabel={t("over_by")}
        />
      </div>

      <div className="row between">
        <span className="eyebrow">{t("categories")}</span>
      </div>
      <div className="card catlist" style={{ padding: 16 }}>
        {CATEGORIES.map((c) => (
          <CategoryRow
            key={c}
            label={t("cat_" + c)}
            category={c}
            spent={weekByCat[c]}
            budget={perCatBudget}
          />
        ))}
      </div>

      <div className="spacer" />

      {/* quick actions */}
      <div className="quick">
        <button className="quick__btn" onClick={() => openAdd("receipt")}>
          <span className="quick__ic">📷</span>{t("add_receipt")}
        </button>
        <button className="quick__btn" onClick={() => openAdd("gallery")}>
          <span className="quick__ic">🖼️</span>{t("add_gallery")}
        </button>
        <button className="quick__btn" onClick={() => openAdd("manual")}>
          <span className="quick__ic">＋</span>{t("add_manual")}
        </button>
        <button className="quick__btn" onClick={() => setSheet("extra")}>
          <span className="quick__ic">💰</span>{t("extra_income")}
        </button>
      </div>

      {/* nav bar */}
      <div className="navbar">
        <button className="navbar__item" onClick={() => go("edit")}>≣ {t("edit_spendings")}</button>
        <button className="navbar__item" onClick={() => go("guide")}>？ {t("user_guide")}</button>
        <button className="navbar__item" onClick={() => go("settings")}>⚙︎ {t("settings")}</button>
      </div>

      <AddSpendSheet open={sheet === "add"} source={addSource} onClose={() => setSheet(null)} />
      <ExtraIncomeSheet open={sheet === "extra"} onClose={() => setSheet(null)} />
      <AdjustBudgetSheet open={sheet === "adjust"} onClose={() => setSheet(null)} />
    </div>
  );
}
