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

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  monthlyIncome: number;
  weeklyBudget: number;
  savingPercentage: number;
  todaySpending: number;
  weekSpending: number;
  lastWeekSpending: number;
  categoryBreakdown?: Record<string, number>;
}

/**
 * Streams the /chat SSE endpoint. Calls onChunk for each token as it
 * arrives. The chat history is supplied by the caller (read from the
 * client's own persisted store) and is not retained by the server.
 */
export async function streamChat(
  params: {
    messages: ChatMsg[];
    context: ChatContext;
    language: "en" | "ar";
  },
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: params.messages,
      language: params.language === "ar" ? "Arabic" : "English",
      context: {
        monthly_income: params.context.monthlyIncome,
        weekly_budget: params.context.weeklyBudget,
        saving_percentage: params.context.savingPercentage,
        today_spending: params.context.todaySpending,
        week_spending: params.context.weekSpending,
        last_week_spending: params.context.lastWeekSpending,
        category_breakdown: params.context.categoryBreakdown,
      },
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error("chat request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      let payload: { chunk?: string; status?: string; error?: string };
      try {
        payload = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }
      if (payload.chunk) onChunk(payload.chunk);
      if (payload.status === "error") throw new Error(payload.error || "chat failed");
    }
  }
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
