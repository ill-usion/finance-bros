import { useState } from "react";
import { useStore } from "./lib/store";
import { LanguagePick } from "./screens/LanguagePick";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { EditSpendings } from "./screens/EditSpendings";
import { FinancialAdvisor } from "./screens/FinancialAdvisor";
import { Settings } from "./screens/Settings";
import { Guide } from "./screens/Guide";
import { NavBar, type Page } from "./components/NavBar";

export default function App() {
  const { ready, settings, profile } = useStore();
  const [langPicked, setLangPicked] = useState(false);
  const [page, setPage] = useState<Page>("home");

  if (!ready) {
    return (
      <div className="app">
        <div className="splash">
          <div className="splash__mark">ميزان</div>
        </div>
      </div>
    );
  }

  const needsLang = !settings.onboarded && !langPicked;
  const showNav = !needsLang && settings.onboarded && !!profile;

  let content;
  if (needsLang) {
    content = <LanguagePick onDone={() => setLangPicked(true)} />;
  } else if (!settings.onboarded || !profile) {
    content = <Onboarding />;
  } else if (page === "home") {
    content = <Home />;
  } else if (page === "edit") {
    content = <EditSpendings />;
  } else if (page === "advisor") {
    content = <FinancialAdvisor />;
  } else if (page === "settings") {
    content = <Settings />;
  } else {
    content = <Guide />;
  }

  return (
    <div className="app">
      {content}
      {showNav && <NavBar page={page} go={setPage} />}
    </div>
  );
}
