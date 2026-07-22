import { useState } from "react";
import { useStore } from "./lib/store";
import { LanguagePick } from "./screens/LanguagePick";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { EditSpendings } from "./screens/EditSpendings";
import { Settings } from "./screens/Settings";
import { Guide } from "./screens/Guide";

type Page = "home" | "edit" | "settings" | "guide";

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

  let content;
  if (needsLang) {
    content = <LanguagePick onDone={() => setLangPicked(true)} />;
  } else if (!settings.onboarded || !profile) {
    content = <Onboarding />;
  } else if (page === "home") {
    content = <Home go={(n) => setPage(n)} />;
  } else if (page === "edit") {
    content = <EditSpendings back={() => setPage("home")} />;
  } else if (page === "settings") {
    content = <Settings back={() => setPage("home")} />;
  } else {
    content = <Guide back={() => setPage("home")} />;
  }

  return <div className="app">{content}</div>;
}
