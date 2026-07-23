import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type Category =
  | "Food"
  | "Transportation"
  | "Leisure"
  | "Subscription"
  | "Groceries"
  | "Other";

export const CATEGORIES: Category[] = [
  "Food",
  "Transportation",
  "Leisure",
  "Subscription",
  "Groceries",
  "Other",
];

export interface Spending {
  id: string;
  amount: number; // OMR, positive value spent
  category: Category;
  product: string;
  /** ISO timestamp */
  at: string;
  source: "manual" | "receipt" | "gallery";
}

export interface Profile {
  monthlyIncome: number;
  weeklyBudget: number;
  savingPercentage: number; // 0..50
  /** forecast per category is derived; store the raw forecast series if present */
  forecast: number[];
  score?: number;
  scoreReasoning?: string;
  createdAt: string;
}

export interface Settings {
  language: "en" | "ar";
  theme: "light" | "dark";
  onboarded: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** ISO timestamp */
  at: string;
}

interface MeezanDB extends DBSchema {
  profile: { key: string; value: Profile };
  settings: { key: string; value: Settings };
  spendings: {
    key: string;
    value: Spending;
    indexes: { "by-at": string };
  };
  chatMessages: {
    key: string;
    value: ChatMessage;
    indexes: { "by-at": string };
  };
}

const DB_NAME = "meezan";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<MeezanDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<MeezanDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("profile")) {
          database.createObjectStore("profile");
        }
        if (!database.objectStoreNames.contains("settings")) {
          database.createObjectStore("settings");
        }
        if (!database.objectStoreNames.contains("spendings")) {
          const store = database.createObjectStore("spendings", {
            keyPath: "id",
          });
          store.createIndex("by-at", "at");
        }
        if (!database.objectStoreNames.contains("chatMessages")) {
          const store = database.createObjectStore("chatMessages", {
            keyPath: "id",
          });
          store.createIndex("by-at", "at");
        }
      },
    });
  }
  return dbPromise;
}

// ---- Settings ----
export const DEFAULT_SETTINGS: Settings = {
  language: "en",
  theme: "light",
  onboarded: false,
};

export async function getSettings(): Promise<Settings> {
  const s = await (await db()).get("settings", "settings");
  return s ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await (await db()).put("settings", settings, "settings");
}

// ---- Profile ----
export async function getProfile(): Promise<Profile | undefined> {
  return (await db()).get("profile", "profile");
}

export async function saveProfile(profile: Profile): Promise<void> {
  await (await db()).put("profile", profile, "profile");
}

// ---- Spendings ----
export async function addSpending(s: Spending): Promise<void> {
  await (await db()).put("spendings", s);
}

export async function updateSpending(s: Spending): Promise<void> {
  await (await db()).put("spendings", s);
}

export async function deleteSpending(id: string): Promise<void> {
  await (await db()).delete("spendings", id);
}

export async function allSpendings(): Promise<Spending[]> {
  const all = await (await db()).getAllFromIndex("spendings", "by-at");
  // newest first
  return all.sort((a, b) => (a.at < b.at ? 1 : -1));
}

export async function spendingsBetween(
  startISO: string,
  endISO: string
): Promise<Spending[]> {
  const all = await allSpendings();
  return all.filter((s) => s.at >= startISO && s.at < endISO);
}

export async function wipeAll(): Promise<void> {
  const d = await db();
  await d.clear("profile");
  await d.clear("spendings");
  await d.clear("settings");
  await d.clear("chatMessages");
}

// ---- Chat messages ----
// Persisted per-user in the browser's IndexedDB, never sent to or stored by
// the server — the server only receives the history as part of a request.
export async function allChatMessages(): Promise<ChatMessage[]> {
  // oldest first, chronological order for chat display
  return (await db()).getAllFromIndex("chatMessages", "by-at");
}

export async function addChatMessage(m: ChatMessage): Promise<void> {
  await (await db()).put("chatMessages", m);
}

export async function updateChatMessage(m: ChatMessage): Promise<void> {
  await (await db()).put("chatMessages", m);
}
