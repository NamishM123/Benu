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

type Props = {
  selectedPreferences: string[];
};

export default function MenuAssistant({ selectedPreferences }: Props) {
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      text,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          preferences: selectedPreferences,
        }),
      });

      if (!res.ok) throw new Error("api error");
      const data: ApiResponse = await res.json();
      const botMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "bot",
        text: data.text,
        dishes: data.dishes,
      };
      setMessages((m) => [...m, botMsg]);
    } catch {
      const local = answerMenuQuestion(text, selectedPreferences);
      const botMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "bot",
        text: local.text,
        dishes: local.dishes,
      };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section
      aria-label="Menu assistant"
      className="mt-10 flex flex-col rounded-2xl border border-neutral-300/70 bg-white/60 backdrop-blur-sm"
    >
      <div className="border-b border-neutral-200 px-4 pt-4 pb-2">
        <h2 className="font-serif text-xl tracking-tight text-neutral-900">
          Menu assistant
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Ask about taste, spice, ingredients, or what to order.
        </p>
      </div>

      <div className="flex max-h-96 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "max-w-[80%] self-end"
                : "max-w-[90%] self-start"
            }
          >
            <div
              className={[
                "rounded-2xl px-4 py-2 text-sm leading-relaxed",
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
                    selectedPreferences,
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
                        className="h-14 w-14 flex-none rounded-lg bg-neutral-100 object-cover"
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
        <label htmlFor="menu-chat-input" className="sr-only">
          Ask the menu assistant
        </label>
        <input
          id="menu-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isSending ? "Thinking…" : "Ask about a dish or ingredient…"
          }
          disabled={isSending}
          className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-700/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className={[
            "rounded-full px-4 py-2 text-sm",
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
  );
}
