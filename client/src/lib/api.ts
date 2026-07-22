import type { Category } from "./db";

const BASE = import.meta.env.VITE_API_URL ?? "";

export interface AnalysisResult {
  score: number;
  score_reasoning: string;
  suggested_weekly_budget: number;
  bank_statement: { datetime: string; net_amount: string }[];
  forecast: number[];
}

export type AnalysisStatus =
  | "parsing"
  | "forecasting"
  | "reviewing"
  | "done"
  | "error";

/**
 * Streams the /spending-analysis SSE endpoint. Calls onStatus for each status
 * update and resolves with the final result. Falls back gracefully if the
 * backend is unreachable so onboarding can still complete offline.
 */
export async function analyzeSpending(
  params: {
    monthlyIncome: number;
    weeklyBudget: number;
    savingPercentage: number;
    language: "en" | "ar";
    file: File;
  },
  onStatus: (s: AnalysisStatus) => void
): Promise<AnalysisResult | null> {
  const form = new FormData();
  form.append("monthly_income", String(params.monthlyIncome));
  form.append("weekly_budget", String(params.weeklyBudget));
  form.append("saving_percentage", String(params.savingPercentage));
  form.append("language", params.language === "ar" ? "Arabic" : "English");
  form.append("file", params.file);

  const res = await fetch(`${BASE}/spending-analysis`, {
    method: "POST",
    body: form,
  });

  if (!res.ok || !res.body) {
    onStatus("error");
    return null;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: AnalysisResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      try {
        const payload = JSON.parse(line.slice(5).trim());
        if (payload.status) onStatus(payload.status);
        if (payload.status === "done") result = payload.result;
      } catch {
        // ignore malformed chunk
      }
    }
  }
  return result;
}

export interface ReceiptResult {
  total_amount: number | null;
  product: string | null;
  datetime: string | null;
  category: Category | null;
}

export async function extractReceipt(file: File): Promise<ReceiptResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/extract-receipt`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("extract failed");
  return res.json();
}
