import { useMemo, useState } from "react";
import { useStore, useT } from "../lib/store";
import { Money } from "../components/Money";
import { Sheet } from "../components/UI";
import { NumPad } from "../components/NumPad";
import { CATEGORIES, type Category, type Spending } from "../lib/db";
import { IconEdit, IconTrash } from "../components/Icons";

export function EditSpendings() {
  const { spendings, editSpending, removeSpending, settings } = useStore();
  const t = useT();
  const [edit, setEdit] = useState<Spending | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");

  const groups = useMemo(() => {
    const map = new Map<string, Spending[]>();
    for (const s of spendings) {
      const d = new Date(s.at);
      const key = d.toLocaleDateString(settings.language === "ar" ? "ar" : "en-GB", {
        weekday: "long", day: "numeric", month: "long",
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()];
  }, [spendings, settings.language]);

  const openEdit = (s: Spending) => {
    setEdit(s);
    setAmount(String(s.amount));
    setCategory(s.category);
  };

  const saveEdit = async () => {
    if (!edit) return;
    await editSpending({ ...edit, amount: parseFloat(amount) || edit.amount, category });
    setEdit(null);
  };

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString(settings.language === "ar" ? "ar" : "en-GB", {
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="screen screen--pad-safe rise" style={{ gap: 12 }}>
      <div className="row between">
        <span className="eyebrow">{t("edit_spendings")}</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        {groups.length === 0 && (
          <p className="subtitle" style={{ textAlign: "center", marginTop: 40 }}>{t("no_spendings")}</p>
        )}
        {groups.map(([date, items]) => (
          <div key={date}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{date}</div>
            <div className="card" style={{ padding: 6 }}>
              {items.map((s) => (
                <div key={s.id} className="txn">
                  <div className="txn__main">
                    <div className="txn__prod">{s.product}</div>
                    <div className="txn__meta">{t("cat_" + s.category)} · {time(s.at)}</div>
                  </div>
                  <Money amount={s.amount} size={15} bold />
                  <div className="txn__actions">
                    <button className="txn__act" onClick={() => openEdit(s)} aria-label={t("edit")}>
                      <IconEdit size={15} />
                    </button>
                    <button className="txn__act txn__act--del" onClick={() => removeSpending(s.id)} aria-label={t("delete")}>
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={t("edit")}>
        <NumPad value={amount} onChange={setAmount} />
        <div className="catpick" style={{ marginTop: 14 }}>
          {CATEGORIES.map((c) => (
            <button key={c} className={"catpick__chip" + (c === category ? " catpick__chip--on" : "")} onClick={() => setCategory(c)}>
              {t("cat_" + c)}
            </button>
          ))}
        </div>
        <button className="btn btn--primary btn--block" style={{ marginTop: 16 }} onClick={saveEdit}>{t("save")}</button>
      </Sheet>
    </div>
  );
}
