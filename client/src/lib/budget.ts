import type { Profile, Spending, Category } from "./db";
import { CATEGORIES } from "./db";

/** Weekly budget after removing the savings slice. */
export function effectiveWeeklyBudget(p: Pick<Profile, "weeklyBudget" | "savingPercentage">): number {
  return p.weeklyBudget * (1 - p.savingPercentage / 100);
}

export function dailyLimit(p: Pick<Profile, "weeklyBudget" | "savingPercentage">): number {
  return effectiveWeeklyBudget(p) / 7;
}

export function weeklySaved(p: Pick<Profile, "weeklyBudget" | "savingPercentage">): number {
  return p.weeklyBudget * (p.savingPercentage / 100);
}

export function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Week starts Saturday in Oman. */
export function startOfWeek(d = new Date()): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 1) % 7; // days since Saturday
  x.setDate(x.getDate() - diff);
  return x;
}

export function sumByCategory(spendings: Spending[]): Record<Category, number> {
  const out = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const s of spendings) out[s.category] += s.amount;
  return out;
}

export function total(spendings: Spending[]): number {
  return spendings.reduce((a, s) => a + s.amount, 0);
}
