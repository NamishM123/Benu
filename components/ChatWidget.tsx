"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatPrice,
  spiceLabel,
  type MenuItem,
  type SpiceLevel,
} from "@/lib/menu";
import { findFlaggedPreferences } from "@/lib/preferences";
import { answerMenuQuestion } from "@/lib/chatbot";
import { getStoredPreferences } from "@/lib/preferences-store";

type ChatMessage = {
  id: number;
  role: "user" | "bot";
  text: string;
  dishes?: MenuItem[];
};

type ApiDish = {
  name: string;
  price: number;
  category: string;
  description: string;
  spiceLevel: SpiceLevel;
  tags: string[];
  image: string;
};

type ApiResponse = {
  text: string;
  dishes?: ApiDish[];
};

type ChatWidgetProps = {
  hidden?: boolean;
};

/**
 * Lightweight slur / profanity guard. Normalises the input (lowercased,
 * non-letters stripped) so common obfuscations like "n!gga" or "n.i.g.g.a"
 * still match. This isn't comprehensive — it's just a first line of
 * defence against the most blatant offensive language in a customer-facing
 * chat. The list intentionally stays short and explicit.
 */
const OFFENSIVE_TERMS = [
  "nigga",
  "nigger",
  "faggot",
  "fag",
  "tranny",
  "retard",
  "kike",
  "spic",
  "chink",
  "gook",
  "dyke",
  "wetback",
  "cunt",
];

function containsOffensiveLanguage(input: string): boolean {
  const normalised = input.toLowerCase().replace(/[^a-z]/g, "");
  return OFFENSIVE_TERMS.some((term) => normalised.includes(term));
}

export default function ChatWidget({ hidden = false }: ChatWidgetProps = {}) {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "bot",
      text: "Hi, I'm Benu. Tell me what you are craving, what you avoid, or how hungry you are. I'll help you find the right dish.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPreferences(getStoredPreferences());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(detail)) setPreferences(detail);
    }
    function onStorage(e: StorageEvent) {
      if (e.key === "benu.dietary-preferences") {
        setPreferences(getStoredPreferences());
      }
    }
    window.addEventListener("benu:preferences-changed", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("benu:preferences-changed", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    // Basic profanity / slur guard. Doesn't aim to catch everything —
    // just stops the most common offensive terms from being sent or
    // showing up in the chat history.
    if (containsOffensiveLanguage(text)) {
      setInput("");
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "bot",
          text: "Let's keep things respectful. Please rephrase your question without slurs or offensive language.",
        },
      ]);
      return;
    }

    const userMsg: ChatMessage = { id: Date.now(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, preferences }),
      });
      if (!res.ok) throw new Error("api error");
      const data: ApiResponse = await res.json();
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "bot",
          text: data.text,
          dishes: data.dishes,
        },
      ]);
    } catch {
      const local = answerMenuQuestion(text, preferences);
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "bot",
          text: local.text,
          dishes: local.dishes,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu assistant" : "Open menu assistant"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 shadow-lg transition-colors duration-150 ease-out hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-700/30"
      >
        {open ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {open && (
        <section
          aria-label="Menu assistant"
          className="fixed bottom-24 right-4 z-40 flex w-[calc(100vw-2rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-neutral-300/70 bg-white shadow-2xl sm:h-[min(520px,calc(100vh-10rem))]"
          style={{ maxHeight: "min(520px, calc(100vh - 10rem))" }}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 pt-4 pb-3">
            <div>
              <h2 className="font-serif text-2xl tracking-tight text-neutral-900">
                Ask Benu In Any Language
              </h2>
              {preferences.length > 0 && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  Avoiding: {preferences.join(", ")}
                </p>
              )}
            </div>
          </div>

          <div
            className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
            style={{
              backgroundImage: "url(/chat-bg.png)",
              backgroundRepeat: "repeat",
              backgroundSize: "260px auto",
            }}
          >
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const samePrev = prev?.role === m.role;
              const isUser = m.role === "user";
              return (
              <div
                key={m.id}
                className={[
                  "flex items-end gap-1.5",
                  isUser ? "flex-row-reverse self-end" : "self-start",
                  samePrev ? "mt-0.5" : "mt-3",
                  isUser ? "max-w-[85%]" : "max-w-[92%]",
                ].join(" ")}
              >
                {/* Bot avatar — shown only on the first message of a cluster */}
                {!isUser && (
                  <div
                    aria-hidden="true"
                    className={[
                      "flex h-7 w-7 flex-none items-center justify-center rounded-full bg-cantaloupe text-[13px] text-neutral-900",
                      samePrev ? "invisible" : "",
                    ].join(" ")}
                  >
                    🍜
                  </div>
                )}
                <div className="flex flex-col gap-1">
                <div
                  className={[
                    "rounded-3xl px-4 py-2 text-sm leading-relaxed shadow-sm",
                    isUser
                      ? "bg-cantaloupe text-neutral-900"
                      : "bg-white text-neutral-900",
                  ].join(" ")}
                >
                  {m.text}
                </div>

                {m.dishes && m.dishes.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {m.dishes.map((d) => {
                      const flags = findFlaggedPreferences(
                        d as MenuItem,
                        preferences,
                      );
                      return (
                        <li
                          key={d.name}
                          className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-2"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={d.image}
                            alt={d.name}
                            className="h-12 w-12 flex-none rounded-lg bg-neutral-100 object-cover"
                            onError={(e) => {
                              const el = e.currentTarget;
                              if (!el.dataset.fallback) {
                                el.dataset.fallback = "1";
                                el.src =
                                  "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80";
                              }
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="truncate text-sm font-medium text-neutral-900">
                                {d.name}
                              </p>
                              <p className="text-xs text-neutral-600">
                                {formatPrice(d.price)}
                              </p>
                            </div>
                            <p className="line-clamp-2 text-xs text-neutral-500">
                              {d.description}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {d.spiceLevel > 0 && (
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">
                                  {spiceLabel(d.spiceLevel)}
                                </span>
                              )}
                              {flags.map((f) => (
                                <span
                                  key={f}
                                  className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800"
                                >
                                  contains {f.toLowerCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                </div>
              </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-neutral-200 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <label htmlFor="chat-widget-input" className="sr-only">
              Ask the menu assistant
            </label>
            <input
              id="chat-widget-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isSending ? "Thinking…" : "Ask Benu in any language…"}
              disabled={isSending}
              className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-700/30 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className={[
                "rounded-full px-3.5 py-2 text-sm",
                input.trim() && !isSending
                  ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800"
                  : "cursor-not-allowed bg-neutral-200 text-neutral-400",
              ].join(" ")}
              aria-label="Send message"
            >
              Send
            </button>
          </form>
        </section>
      )}
    </>
  );
}
