import { useStore, useT } from "../lib/store";
import { Segmented } from "../components/UI";

export function Settings({ back }: { back: () => void }) {
  const { settings, setLanguage, setTheme, resetAll } = useStore();
  const t = useT();

  const reset = async () => {
    if (window.confirm(t("reset_confirm"))) {
      await resetAll();
    }
  };

  return (
    <div className="screen screen--pad-safe rise" style={{ gap: 16 }}>
      <div className="row between">
        <button className="icon-btn" onClick={back}>‹ {t("home")}</button>
        <span className="eyebrow">{t("settings")}</span>
      </div>

      <div className="field">
        <label className="field__label">{t("language")}</label>
        <Segmented<"en" | "ar">
          value={settings.language}
          onChange={setLanguage}
          options={[
            { value: "en", label: "English" },
            { value: "ar", label: "العربية" },
          ]}
        />
      </div>

      <div className="field">
        <label className="field__label">{t("theme")}</label>
        <Segmented<"light" | "dark">
          value={settings.theme}
          onChange={setTheme}
          options={[
            { value: "light", label: t("light") },
            { value: "dark", label: t("dark") },
          ]}
        />
      </div>

      <div className="spacer" />
      <button className="btn btn--ghost btn--block" style={{ color: "var(--accent)" }} onClick={reset}>
        {t("reset")}
      </button>
    </div>
  );
}
