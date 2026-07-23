import { useT } from "../lib/store";
import { IconHome, IconList, IconGuide, IconSettings } from "./Icons";

export type Page = "home" | "edit" | "settings" | "guide";

export function NavBar({ page, go }: { page: Page; go: (p: Page) => void }) {
  const t = useT();
  const items: { key: Page; label: string; Icon: typeof IconHome }[] = [
    { key: "home", label: t("home"), Icon: IconHome },
    { key: "edit", label: t("edit_spendings"), Icon: IconList },
    { key: "guide", label: t("user_guide"), Icon: IconGuide },
    { key: "settings", label: t("settings"), Icon: IconSettings },
  ];

  return (
    <nav className="navbar">
      {items.map(({ key, label, Icon }) => {
        const active = page === key;
        return (
          <button
            key={key}
            className={"navbar__item" + (active ? " navbar__item--on" : "")}
            onClick={() => go(key)}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={19} className="navbar__icon" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
