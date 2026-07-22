import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import i18n, { applyDirection } from "../i18n";
import {
  getSettings,
  saveSettings,
  getProfile,
  saveProfile,
  allSpendings,
  addSpending,
  updateSpending,
  deleteSpending,
  wipeAll,
  type Settings,
  type Profile,
  type Spending,
  DEFAULT_SETTINGS,
} from "./db";

interface Ctx {
  ready: boolean;
  settings: Settings;
  profile: Profile | undefined;
  spendings: Spending[];
  setLanguage: (l: "en" | "ar") => Promise<void>;
  setTheme: (t: "light" | "dark") => Promise<void>;
  completeOnboarding: (p: Profile) => Promise<void>;
  updateProfile: (p: Partial<Profile>) => Promise<void>;
  logSpending: (s: Spending) => Promise<void>;
  editSpending: (s: Spending) => Promise<void>;
  removeSpending: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<Profile | undefined>();
  const [spendings, setSpendings] = useState<Spending[]>([]);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      const p = await getProfile();
      const sp = await allSpendings();
      i18n.changeLanguage(s.language);
      applyDirection(s.language);
      document.documentElement.setAttribute("data-theme", s.theme);
      setSettings(s);
      setProfile(p);
      setSpendings(sp);
      setReady(true);
    })();
  }, []);

  const setLanguage = useCallback(async (l: "en" | "ar") => {
    const next = { ...settings, language: l };
    await saveSettings(next);
    i18n.changeLanguage(l);
    applyDirection(l);
    setSettings(next);
  }, [settings]);

  const setTheme = useCallback(async (t: "light" | "dark") => {
    const next = { ...settings, theme: t };
    await saveSettings(next);
    document.documentElement.setAttribute("data-theme", t);
    setSettings(next);
  }, [settings]);

  const completeOnboarding = useCallback(async (p: Profile) => {
    await saveProfile(p);
    const next = { ...settings, onboarded: true };
    await saveSettings(next);
    setProfile(p);
    setSettings(next);
  }, [settings]);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!profile) return;
    const next = { ...profile, ...patch };
    await saveProfile(next);
    setProfile(next);
  }, [profile]);

  const logSpending = useCallback(async (s: Spending) => {
    await addSpending(s);
    setSpendings(await allSpendings());
  }, []);

  const editSpending = useCallback(async (s: Spending) => {
    await updateSpending(s);
    setSpendings(await allSpendings());
  }, []);

  const removeSpending = useCallback(async (id: string) => {
    await deleteSpending(id);
    setSpendings(await allSpendings());
  }, []);

  const resetAll = useCallback(async () => {
    await wipeAll();
    setProfile(undefined);
    setSpendings([]);
    const s = { ...DEFAULT_SETTINGS };
    await saveSettings(s);
    setSettings(s);
    i18n.changeLanguage(s.language);
    applyDirection(s.language);
    document.documentElement.setAttribute("data-theme", s.theme);
  }, []);

  return (
    <StoreContext.Provider
      value={{
        ready,
        settings,
        profile,
        spendings,
        setLanguage,
        setTheme,
        completeOnboarding,
        updateProfile,
        logSpending,
        editSpending,
        removeSpending,
        resetAll,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useT() {
  const { t } = useTranslation();
  return t;
}
