import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useStore, useT } from "../lib/store";
import { Money } from "../components/Money";
import { streamChat, type ChatMsg, type LogSpendingCall } from "../lib/api";
import { startOfDay, startOfWeek, sumByCategory, total } from "../lib/budget";
import { CATEGORIES, type Category } from "../lib/db";
import { IconSend, IconCheck } from "../components/Icons";

/** Renders `**bold**` spans from the model's markdown-flavored replies; everything else stays plain text. */
function renderChatText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function FinancialAdvisor() {
  const { profile, spendings, chatMessages, addChatMsg, logSpending, settings } = useStore();
  const t = useT();

  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const pendingLogs = useRef<LogSpendingCall[]>([]);

  const { todaySpent, weekSpent, lastWeekSpent, weekByCat } = useMemo(() => {
    const dayStart = startOfDay().toISOString();
    const weekStart = startOfWeek();
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const now = new Date().toISOString();

    const today = spendings.filter((s) => s.at >= dayStart && s.at <= now);
    const week = spendings.filter((s) => s.at >= weekStart.toISOString() && s.at <= now);
    const lastWeek = spendings.filter(
      (s) => s.at >= lastWeekStart.toISOString() && s.at < weekStart.toISOString()
    );

    return {
      todaySpent: total(today),
      weekSpent: total(week),
      lastWeekSpent: total(lastWeek),
      weekByCat: sumByCategory(week),
    };
  }, [spendings]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages, streamingText]);

  if (!profile) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setError(false);

    const userMsg = {
      id: uuidv4(),
      role: "user" as const,
      content: text,
      at: new Date().toISOString(),
    };
    await addChatMsg(userMsg);

    setSending(true);
    setStreamingText("");
    pendingLogs.current = [];

    const history: ChatMsg[] = [...chatMessages, userMsg]
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    // The backend streams in up to two phases around any tool call: text
    // before it decides to log something, then (after the frontend is asked
    // to log it below) a second pass of text where it confirms the log.
    // Track them separately so a persisted reply never glues the two
    // together, and so the confirmation lands after the log card.
    let preText = "";
    let postText = "";
    let sawToolCall = false;
    try {
      await streamChat(
        {
          messages: history,
          language: settings.language,
          context: {
            monthlyIncome: profile.monthlyIncome,
            weeklyBudget: profile.weeklyBudget,
            savingPercentage: profile.savingPercentage,
            todaySpending: todaySpent,
            weekSpending: weekSpent,
            lastWeekSpending: lastWeekSpent,
            categoryBreakdown: weekByCat,
          },
        },
        (chunk) => {
          if (sawToolCall) postText += chunk;
          else preText += chunk;
          setStreamingText(preText + postText);
        },
        (call) => {
          sawToolCall = true;
          pendingLogs.current.push(call);
        }
      );

      if (preText.trim()) {
        await addChatMsg({
          id: uuidv4(),
          role: "assistant",
          content: preText,
          at: new Date().toISOString(),
        });
      }

      // The model only calls log_spending after the user has approved it in
      // chat (enforced by the system prompt); actually writing the entry is
      // the client's job, since spending data lives in the client's own
      // storage rather than on the server.
      for (const call of pendingLogs.current) {
        const amount = Number(call.args.amount);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        const category: Category = CATEGORIES.includes(call.args.category as Category)
          ? (call.args.category as Category)
          : "Other";
        const product = String(call.args.product ?? "").slice(0, 120);

        await logSpending({
          id: uuidv4(),
          amount,
          category,
          product,
          at: new Date().toISOString(),
          source: "assistant",
        });
        await addChatMsg({
          id: uuidv4(),
          role: "assistant",
          kind: "log",
          content: t("logged_spending"),
          logAmount: amount,
          logCategory: category,
          logProduct: product,
          at: new Date().toISOString(),
        });
      }

      if (postText.trim()) {
        await addChatMsg({
          id: uuidv4(),
          role: "assistant",
          content: postText,
          at: new Date().toISOString(),
        });
      }
    } catch {
      setError(true);
    } finally {
      pendingLogs.current = [];
      setStreamingText(null);
      setSending(false);
    }
  };

  return (
    <div className="screen screen--pad-safe rise" style={{ gap: 14 }}>
      <div className="row between">
        <span className="eyebrow">{t("advisor_title")}</span>
      </div>

      <div className="row between" style={{ gap: 12 }}>
        <div className="card stat">
          <div className="stat__label">{t("today")}</div>
          <Money amount={todaySpent} size={20} bold />
        </div>
        <div className="card stat">
          <div className="stat__label">{t("this_week")}</div>
          <Money amount={weekSpent} size={20} bold />
        </div>
      </div>

      <div className="chat" ref={listRef}>
        {chatMessages.length === 0 && streamingText === null && (
          <p className="subtitle" style={{ textAlign: "center", marginTop: 24 }}>
            {t("chat_empty")}
          </p>
        )}
        {chatMessages.map((m) =>
          m.kind === "log" ? (
            <div key={m.id} className="bubble bubble--assistant bubble--log">
              <div className="logcard">
                <IconCheck size={16} className="logcard__ic" />
                <div className="logcard__body">
                  <Money amount={m.logAmount ?? 0} size={14} bold />
                  <span className="logcard__meta">
                    {m.logCategory ? t("cat_" + m.logCategory) : ""}
                    {m.logProduct ? " · " + m.logProduct : ""}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div key={m.id} className={"bubble bubble--" + m.role}>
              {renderChatText(m.content)}
            </div>
          )
        )}
        {streamingText !== null && (
          <div className="bubble bubble--assistant">
            {streamingText ? (
              renderChatText(streamingText)
            ) : (
              <span className="bubble__typing">
                <span />
                <span />
                <span />
              </span>
            )}
          </div>
        )}
        {error && (
          <p className="subtitle" style={{ color: "var(--accent)", textAlign: "center" }}>
            {t("chat_error")}
          </p>
        )}
      </div>

      <div className="chatbar">
        <input
          className="chatbar__input"
          placeholder={t("chat_placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={sending}
        />
        <button
          className="chatbar__send"
          onClick={send}
          disabled={sending || !input.trim()}
          aria-label={t("chat_send")}
        >
          <IconSend size={17} />
        </button>
      </div>
    </div>
  );
}
