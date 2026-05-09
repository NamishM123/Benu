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

export default function ChatWidget({ hidden = false }: ChatWidgetProps = {}) {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "bot",
      text: "Hi! I'm your menu assistant. Ask me about flavors, spice levels, ingredients, or what to order.",
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
          className="fixed bottom-24 right-4 z-40 flex w-[calc(100vw-2rem)] max-w-[380px] flex-col rounded-2xl border border-neutral-300/70 bg-white shadow-2xl"
          style={{ maxHeight: "min(640px, calc(100vh - 8rem))" }}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 pt-4 pb-3">
            <div>
              <h2 className="font-serif text-lg tracking-tight text-neutral-900">
                Menu assistant
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {preferences.length > 0
                  ? `Avoiding: ${preferences.join(", ")}`
                  : "Ask about taste, spice, or what to order."}
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "max-w-[85%] self-end"
                    : "max-w-[92%] self-start"
                }
              >
                <div
                  className={[
                    "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-md bg-neutral-900 text-neutral-50"
                      : "rounded-bl-md bg-neutral-100 text-neutral-900",
                  ].join(" ")}
                >
                  {m.text}
                </div>

                {m.dishes && m.dishes.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-2">
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
            ))}
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
              placeholder={isSending ? "Thinking…" : "Ask anything…"}
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
