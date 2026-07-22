import { useState } from "react";
import { Sheet, Segmented, Slider } from "../../components/UI";
import { NumPad } from "../../components/NumPad";
import { Money } from "../../components/Money";
import { useStore, useT } from "../../lib/store";

type Apply = "week" | "month" | "save";

export function ExtraIncomeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, updateProfile } = useStore();
  const t = useT();
  const [amount, setAmount] = useState("");
  const [apply, setApply] = useState<Apply>("week");
  const [savePct, setSavePct] = useState(0);

  const amt = parseFloat(amount) || 0;
  const toSave = apply === "save" ? amt : (amt * savePct) / 100;
  const toSpend = amt - toSave;

  const commit = async () => {
    if (!profile || amt <= 0) return;
    if (apply === "week") {
      await updateProfile({ weeklyBudget: profile.weeklyBudget + toSpend });
    } else if (apply === "month") {
      await updateProfile({ weeklyBudget: profile.weeklyBudget + toSpend / 4 });
    }
    // "save" adds nothing to spendable budget
    onClose();
    setAmount("");
    setSavePct(0);
    setApply("week");
  };

  return (
    <Sheet open={open} onClose={onClose} title={t("extra_income_title")}>
      <NumPad value={amount} onChange={setAmount} />

      <label className="field__label" style={{ marginTop: 16, display: "block" }}>{t("how_apply")}</label>
      <Segmented<Apply>
        value={apply}
        onChange={setApply}
        options={[
          { value: "week", label: t("apply_week") },
          { value: "month", label: t("apply_month") },
          { value: "save", label: t("apply_save") },
        ]}
      />

      {apply !== "save" && (
        <div style={{ marginTop: 16 }}>
          <div className="row between">
            <span className="field__label">{t("save_portion")}</span>
            <span style={{ fontWeight: 700, color: "var(--good)" }}>{savePct}%</span>
          </div>
          <Slider value={savePct} min={0} max={100} onChange={setSavePct} />
          <div className="row between" style={{ fontSize: 14, color: "var(--text-dim)", marginTop: 8 }}>
            <span>{t("saved_weekly")}: <Money amount={toSave} size={13} /></span>
            <span>{t("daily_spend")}: <Money amount={toSpend} size={13} /></span>
          </div>
        </div>
      )}

      <button className="btn btn--primary btn--block" style={{ marginTop: 18 }} onClick={commit} disabled={amt <= 0}>
        {t("apply")}
      </button>
    </Sheet>
  );
}
