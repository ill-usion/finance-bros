import { useEffect, useRef, useState } from "react";
import { Sheet } from "../../components/UI";
import { NumPad } from "../../components/NumPad";
import { useStore, useT } from "../../lib/store";
import { CATEGORIES, type Category, type Spending } from "../../lib/db";
import { extractReceipt } from "../../lib/api";
import { v4 as uuidv4 } from 'uuid';

export function AddSpendSheet({
  open,
  source,
  onClose,
}: {
  open: boolean;
  source: "manual" | "receipt" | "gallery";
  onClose: () => void;
}) {
  const { logSpending } = useStore();
  const t = useT();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [product, setProduct] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // When opened for a photo source, trigger the picker immediately.
  useEffect(() => {
    if (open && (source === "receipt" || source === "gallery")) {
      const id = setTimeout(() => fileRef.current?.click(), 50);
      return () => clearTimeout(id);
    }
    if (open) {
      setAmount("");
      setProduct("");
      setCategory("Food");
    }
  }, [open, source]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const r = await extractReceipt(f);
      if (r.total_amount != null) setAmount(String(r.total_amount));
      if (r.product) setProduct(r.product);
      if (r.category && CATEGORIES.includes(r.category)) setCategory(r.category);
    } catch {
      /* leave fields for manual entry */
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) return;
    const s: Spending = {
      id: uuidv4(),
      amount: amt,
      category,
      product: product || t("cat_" + category),
      at: new Date().toISOString(),
      source,
    };
    await logSpending(s);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={t("add_manual")}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture={source === "receipt" ? "environment" : undefined}
        hidden
        onChange={onFile}
      />
      {busy ? (
        <div className="analyzing">
          <div className="analyzing__box">
            <span className="pulse" />
            <p className="analyzing__text">{t("analyzing")}</p>
          </div>
        </div>
      ) : (
        <NumPad value={amount} onChange={setAmount} />
      )}


      <div className="field" style={{ marginTop: 16 }}>
        <label className="field__label">{t("what_for")}</label>
        <input
          className="field__input"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder={t("cat_" + category)}
        />
      </div>

      <label className="field__label">{t("category")}</label>
      <div className="catpick">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={"catpick__chip" + (c === category ? " catpick__chip--on" : "")}
            onClick={() => setCategory(c)}
          >
            {t("cat_" + c)}
          </button>
        ))}
      </div>

      <button className="btn btn--primary btn--block" style={{ marginTop: 16 }} onClick={save} disabled={!(parseFloat(amount) > 0)}>
        {t("save")}
      </button>
    </Sheet>
  );
}
