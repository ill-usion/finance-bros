import { Rial } from "./Rial";

/**
 * A custom number-only keypad. We render our own instead of a native keyboard
 * so numeric entry is guaranteed everywhere (and shows 3-decimal baisa entry
 * cleanly). Value is a string the parent parses.
 */
export function NumPad({
  value,
  onChange,
  showRial = true,
}: {
  value: string;
  onChange: (v: string) => void;
  showRial?: boolean;
}) {
  const press = (k: string) => {
    if (k === "del") {
      onChange(value.slice(0, -1));
      return;
    }
    if (k === ".") {
      if (value.includes(".")) return;
      onChange((value === "" ? "0" : value) + ".");
      return;
    }
    // limit to 3 decimals
    const dot = value.indexOf(".");
    if (dot >= 0 && value.length - dot > 3) return;
    if (value === "0") {
      onChange(k);
      return;
    }
    onChange(value + k);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];

  return (
    <div className="numpad">
      <div className="numpad__display">
        {showRial && <Rial size={26} />}
        <span className="numpad__value">{value === "" ? "0.000" : value}</span>
      </div>
      <div className="numpad__grid">
        {keys.map((k) => (
          <button
            key={k}
            className={"numpad__key" + (k === "del" ? " numpad__key--del" : "")}
            onClick={() => press(k)}
            aria-label={k === "del" ? "Delete" : k}
          >
            {k === "del" ? "⌫" : k}
          </button>
        ))}
      </div>
    </div>
  );
}
