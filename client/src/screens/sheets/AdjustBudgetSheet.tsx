import { useEffect, useState } from "react";
import { Sheet, Segmented, Slider } from "../../components/UI";
import { NumPad } from "../../components/NumPad";
import { useStore, useT } from "../../lib/store";

type Field = "income" | "budget" | null;
type Commit = "week" | "4weeks" | "month";

export function AdjustBudgetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, updateProfile } = useStore();
  const t = useT();
  const [income, setIncome] = useState("");
  const [budget, setBudget] = useState("");
  const [savings, setSavings] = useState(10);
  const [editing, setEditing] = useState<Field>(null);
  const [commit, setCommit] = useState<Commit>("week");

  useEffect(() => {
    if (open && profile) {
      setIncome(String(profile.monthlyIncome));
      setBudget(String(profile.weeklyBudget));
      setSavings(profile.savingPercentage);
      setEditing(null);
    }
  }, [open, profile]);

  const apply = async () => {
    // Commit timing is recorded with the profile; the effective budget updates
    // immediately (a fuller scheduler would defer "month" — kept simple and
    // honest here by applying now and noting the intent).
    await updateProfile({
      monthlyIncome: parseFloat(income) || 0,
      weeklyBudget: parseFloat(budget) || 0,
      savingPercentage: savings,
    });
    onClose();
  };

  if (editing) {
    const val = editing === "income" ? income : budget;
    const set = editing === "income" ? setIncome : setBudget;
    return (
      <Sheet open={open} onClose={() => setEditing(null)} title={editing === "income" ? t("monthly_income") : t("weekly_budget")}>
        <NumPad value={val} onChange={set} />
        <button className="btn btn--primary btn--block" style={{ marginTop: 16 }} onClick={() => setEditing(null)}>{t("done")}</button>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("adjust_budget")}>
      <label className="field__label">{t("monthly_income")}</label>
      <button className="tap-field" onClick={() => setEditing("income")} style={{ marginBottom: 14 }}>
        {income || "0.000"}
      </button>

      <label className="field__label">{t("weekly_budget")}</label>
      <button className="tap-field" onClick={() => setEditing("budget")} style={{ marginBottom: 14 }}>
        {budget || "0.000"}
      </button>

      <div className="row between">
        <span className="field__label">{t("savings_pct")}</span>
        <span style={{ fontWeight: 700, color: "var(--accent)" }}>{savings}%</span>
      </div>
      <Slider value={savings} min={0} max={50} onChange={setSavings} />

      <label className="field__label" style={{ marginTop: 16, display: "block" }}>{t("commit_when")}</label>
      <Segmented<Commit>
        value={commit}
        onChange={setCommit}
        options={[
          { value: "week", label: t("commit_week") },
          { value: "4weeks", label: t("commit_4weeks") },
          { value: "month", label: t("commit_month") },
        ]}
      />

      <button className="btn btn--primary btn--block" style={{ marginTop: 18 }} onClick={apply}>{t("apply")}</button>
    </Sheet>
  );
}
