import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useStore, useT } from "../lib/store";
import { Money } from "../components/Money";
import { streamChat, type ChatMsg } from "../lib/api";
import { startOfDay, startOfWeek, sumByCategory, total } from "../lib/budget";
import { IconSend } from "../components/Icons";

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
  const { profile, spendings, chatMessages, addChatMsg, settings } = useStore();
  const t = useT();

  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

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

    const history: ChatMsg[] = [...chatMessages, userMsg]
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    let acc = "";
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
          acc += chunk;
          setStreamingText(acc);
        }
      );
      await addChatMsg({
        id: uuidv4(),
        role: "assistant",
        content: acc,
        at: new Date().toISOString(),
      });
    } catch {
      setError(true);
    } finally {
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
        {chatMessages.map((m) => (
          <div key={m.id} className={"bubble bubble--" + m.role}>
            {renderChatText(m.content)}
          </div>
        ))}
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
