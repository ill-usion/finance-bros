import { useStore, useT } from "../lib/store";

function UKFlag() {
  return (
    <svg viewBox="0 0 60 30" className="flag" aria-hidden>
      <clipPath id="uk"><rect width="60" height="30" rx="4" /></clipPath>
      <g clipPath="url(#uk)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 60,30 M60,0 0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 60,30 M60,0 0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#uk)" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function OmanFlag() {
  return (
    <svg viewBox="0 0 60 30" className="flag" aria-hidden>
      <clipPath id="om"><rect width="60" height="30" rx="4" /></clipPath>
      <g clipPath="url(#om)">
        <rect width="60" height="30" fill="#fff" />
        <rect y="0" width="60" height="10" fill="#fff" />
        <rect y="10" width="60" height="10" fill="#db161b" />
        <rect y="20" width="60" height="10" fill="#008000" />
        <rect width="18" height="30" fill="#db161b" />
        <g stroke="#fff" strokeWidth="1.4" fill="none">
          <path d="M9 6 l0 8 M6 9 l6 0" />
          <path d="M6.5 8 q2.5 3 5 0" />
        </g>
      </g>
    </svg>
  );
}

export function LanguagePick({ onDone }: { onDone: () => void }) {
  const { setLanguage } = useStore();
  const t = useT();

  const pick = async (l: "en" | "ar") => {
    await setLanguage(l);
    onDone();
  };

  return (
    <div className="screen rise" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div style={{ marginBottom: 8 }}>
        <div className="eyebrow">{t("tagline")}</div>
        <h1 className="title" style={{ fontSize: "clamp(40px,12vw,58px)", letterSpacing: "-0.02em" }}>
          {t("appName")}
        </h1>
      </div>
      <p className="subtitle" style={{ marginBottom: 20 }}>{t("choose_language")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
        <button className="lang-card" onClick={() => pick("en")}>
          <UKFlag />
          <span>English</span>
        </button>
        <button className="lang-card" onClick={() => pick("ar")}>
          <OmanFlag />
          <span>العربية</span>
        </button>
      </div>
    </div>
  );
}
