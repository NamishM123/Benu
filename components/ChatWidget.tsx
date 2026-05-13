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
import {
  CUSTOM_ALLERGENS_EVENT,
  getStoredCustomAllergens,
  getStoredPreferences,
  setStoredCustomAllergens,
  setStoredPreferences,
} from "@/lib/preferences-store";
import {
  dishMatchesCustomAllergen,
  extractAllergensFromText,
  extractCustomAllergens,
} from "@/lib/allergen-detect";
import { isMedicalEmergency } from "@/lib/emergency-detect";
import { getEmergencyMessage } from "@/lib/emergency-messages";
import { detectLanguage } from "@/lib/lang-detect";
import { containsOffensiveLanguage } from "@/lib/profanity";
import { useTranslation } from "@/lib/i18n";

type ChatMessage = {
  id: number;
  role: "user" | "bot";
  text: string;
  dishes?: MenuItem[];
  emergency?: boolean;
};

type ApiDish = {
  name: string;
  nameZh?: string;
  price: number;
  category: string;
  description: string;
  descriptionZh?: string;
  spiceLevel: SpiceLevel;
  tags: string[];
  image: string;
};

type ApiResponse = {
  text: string;
  dishes?: ApiDish[];
  detectedAllergens?: string[];
  detectedCustomAllergens?: string[];
  isEmergency?: boolean;
};

type ChatWidgetProps = {
  hidden?: boolean;
  // Called when the diner taps the "+" button on a suggested dish. The
  // parent looks up the full MenuItem by name and opens the item detail
  // sheet so the customer can pick options / quantity before adding.
  onSelectDish?: (itemName: string) => void;
};

// Render `**bold**` segments as <strong>; everything else passes through.
function renderInlineMarkdown(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
  );
}

const SWIPE_DISMISS_THRESHOLD = 80; // px to drag header down before closing

export default function ChatWidget({
  hidden = false,
  onSelectDish,
}: ChatWidgetProps = {}) {
  const { t, lang } = useTranslation();
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  // SAFETY: cumulative custom allergens (free-text ingredients the user
  // named — cucumber, sesame, egg) for the entire conversation. Sent on
  // every request so the constraint persists across turns. The standard
  // 6 allergens live in `preferences` (dietary filter); these are the
  // ad-hoc ones the user mentioned in chat. Persisted to localStorage
  // so a page refresh, navigation, or device sleep can't drop them —
  // an allergy stated five turns ago must still apply tomorrow.
  const [sessionCustomAllergens, setSessionCustomAllergensState] = useState<
    string[]
  >([]);
  function setSessionCustomAllergens(list: string[]) {
    setSessionCustomAllergensState(list);
    setStoredCustomAllergens(list);
  }
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "bot",
      text: t("chatGreeting"),
    },
  ]);

  // Refresh greeting when language changes (only if it's still the only message)
  useEffect(() => {
    setMessages((m) => {
      if (m.length === 1 && m[0].role === "bot" && m[0].id === 0) {
        return [{ id: 0, role: "bot", text: t("chatGreeting") }];
      }
      return m;
    });
  }, [lang, t]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [scrollHidden, setScrollHidden] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  // Tracks the on-screen keyboard so the chat panel stays above it instead of
  // letting iOS scroll the whole page to expose the focused input.
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [vvHeight, setVvHeight] = useState<number | null>(null);
  const [vvOffsetTop, setVvOffsetTop] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Hide the floating launcher while the user is actively scrolling down so
  // it doesn't sit over the menu items they're trying to read. It reappears
  // once they pause scrolling (or scroll back up).
  useEffect(() => {
    let lastY = window.scrollY;
    let lastShownAt = Date.now();
    const REAPPEAR_PAUSE_MS = 300;
    let raf = 0;

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const delta = y - lastY;
        lastY = y;
        if (delta > 4 && y > 80) {
          setScrollHidden(true);
        } else if (delta < -4 || Date.now() - lastShownAt > REAPPEAR_PAUSE_MS) {
          setScrollHidden(false);
          lastShownAt = Date.now();
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    startYRef.current = e.touches[0].clientY;
    draggingRef.current = true;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!draggingRef.current || startYRef.current == null) return;
    const dy = e.touches[0].clientY - startYRef.current;
    // Only react to downward swipes
    setDragOffset(Math.max(0, dy));
  }

  function handleTouchEnd() {
    if (dragOffset > SWIPE_DISMISS_THRESHOLD) {
      setOpen(false);
    }
    setDragOffset(0);
    draggingRef.current = false;
    startYRef.current = null;
  }

  // Reset any drag offset when the panel reopens
  useEffect(() => {
    if (open) setDragOffset(0);
  }, [open]);

  // Track viewport size so we can apply the mobile-only layout style props.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Lock page scroll while the chat is open ONLY on mobile, where the chat
  // is a fullscreen overlay. We freeze the body in place using
  // position:fixed (overflow:hidden alone isn't enough on iOS Safari — it
  // still auto-scrolls when the input is focused, exposing menu cards
  // behind the chat panel).
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 639px)").matches) return;

    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    const origHtml = { overflow: html.style.overflow };
    const orig = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      Object.assign(body.style, orig);
      Object.assign(html.style, origHtml);
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    setPreferences(getStoredPreferences());
    setSessionCustomAllergensState(getStoredCustomAllergens());
    function onPrefsChange(e: Event) {
      const detail = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(detail)) setPreferences(detail);
    }
    function onCustomChange(e: Event) {
      const detail = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(detail)) setSessionCustomAllergensState(detail);
    }
    function onStorage(e: StorageEvent) {
      if (e.key === "benu.dietary-preferences") {
        setPreferences(getStoredPreferences());
      } else if (e.key === "benu.custom-allergens") {
        setSessionCustomAllergensState(getStoredCustomAllergens());
      }
    }
    window.addEventListener("benu:preferences-changed", onPrefsChange);
    window.addEventListener(CUSTOM_ALLERGENS_EVENT, onCustomChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("benu:preferences-changed", onPrefsChange);
      window.removeEventListener(CUSTOM_ALLERGENS_EVENT, onCustomChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // When a new message arrives, scroll its TOP into view so long bot replies
  // are readable from the start. The very first render shows the greeting
  // (no scroll needed), so we only scroll once messages.length grows.
  useEffect(() => {
    if (!open) return;
    if (messages.length <= 1) return;
    latestMessageRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [messages.length, open]);

  // Keyboard-aware positioning: track visualViewport so the panel sits just
  // above the keyboard with no awkward whole-page shift.
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    function update() {
      if (!vv) return;
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(inset);
      setVvHeight(vv.height);
      setVvOffsetTop(vv.offsetTop);
    }
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setKeyboardInset(0);
      setVvHeight(null);
      setVvOffsetTop(0);
    };
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    // SAFETY: extract allergens BEFORE the emergency check so the
    // constraint sticks even when the user's distress message also
    // names an allergen ("OK GREAT IM ALLERGIC TO CUCUMBERS").
    const detectedStandard = extractAllergensFromText(text);
    const detectedCustomNow = extractCustomAllergens(text);
    const mergedPrefs = Array.from(
      new Set([...preferences, ...detectedStandard]),
    );
    const mergedCustom = Array.from(
      new Set([...sessionCustomAllergens, ...detectedCustomNow]),
    );
    if (detectedCustomNow.length > 0) {
      setSessionCustomAllergens(mergedCustom);
    }

    // SAFETY: medical-emergency intercept (highest priority). If the
    // message looks like an emergency, render the emergency banner
    // immediately and DO NOT call the LLM. The LLM has previously
    // responded "what flavors are you in the mood for?" to "I'm dying
    // could you help me" — never trust it for this case.
    if (isMedicalEmergency(text)) {
      // Detect the user's language from THEIR message (not the UI
      // language), so a French speaker who hasn't toggled the chat
      // language picker still gets a French emergency response.
      const detectedLang = detectLanguage(text);
      const emergencyText = getEmergencyMessage(detectedLang);
      const userMsg: ChatMessage = { id: Date.now(), role: "user", text };
      setInput("");
      setMessages((m) => [
        ...m,
        userMsg,
        {
          id: Date.now() + 1,
          role: "bot",
          text: emergencyText,
          emergency: true,
        },
      ]);
      return;
    }

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
          text: t("chatProfanity"),
        },
      ]);
      return;
    }

    const userMsg: ChatMessage = { id: Date.now(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsSending(true);

    function persistDetected(extra: string[] | undefined) {
      const all = Array.from(
        new Set([...preferences, ...detectedStandard, ...(extra ?? [])]),
      );
      if (all.length > preferences.length) {
        // Saving fires the benu:preferences-changed event, which updates
        // the dietary filter pill in the header AND this component's own
        // `preferences` state — so the user sees the filter has been
        // toggled on for them.
        setStoredPreferences(all);
      }
    }
    function persistDetectedCustom(extra: string[] | undefined) {
      if (!extra?.length) return;
      const all = Array.from(new Set([...mergedCustom, ...extra]));
      if (all.length > mergedCustom.length) {
        setSessionCustomAllergens(all);
      }
    }

    // SAFETY: belt-and-suspenders client-side filter. Even after the
    // server's hard filter, drop any dish whose tags include a standard
    // allergen OR whose name/description contains a custom allergen.
    function safeDishes(dishes: ApiDish[] | undefined): ApiDish[] {
      if (!dishes) return [];
      return dishes.filter(
        (d) =>
          findFlaggedPreferences(d as MenuItem, mergedPrefs).length === 0 &&
          dishMatchesCustomAllergen(d, mergedCustom).length === 0,
      );
    }

    // Send the recent conversation so the LLM has memory. Last 8
    // messages (excluding the brand-new user message we're about to
    // ask about) covers ~4 turns of back-and-forth — enough for the
    // model to recognize allergies stated several turns ago, even if
    // the regex detector missed them.
    const history = messages
      .filter((m) => m.text && m.text.length < 600)
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          preferences: mergedPrefs,
          customAllergens: mergedCustom,
          history,
        }),
      });
      if (!res.ok) throw new Error("api error");
      const data: ApiResponse = await res.json();
      persistDetected(data.detectedAllergens);
      persistDetectedCustom(data.detectedCustomAllergens);
      const isEmergency = Boolean(data.isEmergency);
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "bot",
          // For emergencies the server has already localized the message
          // to the language detected from the user's text; trust it and
          // render as-is. For normal replies, the LLM responds in the
          // user's language so data.text is also already correct.
          text: data.text,
          // Suppress dish cards entirely on emergency replies — no menu
          // suggestions while someone might be in anaphylaxis.
          dishes: isEmergency
            ? undefined
            : (safeDishes(data.dishes) as MenuItem[] | undefined),
          emergency: isEmergency || undefined,
        },
      ]);
    } catch {
      persistDetected(undefined);
      const local = answerMenuQuestion(text, mergedPrefs);
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "bot",
          text: local.text,
          dishes: safeDishes(local.dishes as ApiDish[] | undefined) as
            | MenuItem[]
            | undefined,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      {/* Floating launcher — hidden while the panel is open so the user
          collapses the chat with the dash button in the header instead.
          Also auto-hides while scrolling down so it doesn't cover menu cards
          on small screens. */}
      {!open && (
        <button
          type="button"
          aria-label={t("chatOpenAria")}
          aria-expanded={false}
          aria-hidden={scrollHidden}
          tabIndex={scrollHidden ? -1 : 0}
          onClick={() => setOpen(true)}
          className={[
            "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-neutral-50 shadow-lg transition-all duration-200 ease-out hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-700/30",
            scrollHidden
              ? "pointer-events-none translate-y-24 opacity-0"
              : "translate-y-0 opacity-100",
          ].join(" ")}
        >
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
        </button>
      )}

      {open && (
        <>
          {/* Mobile: full-screen "Ask Benu" overlay. The OUTER container is
              locked to `inset-0` with an opaque `bg-cream` and never moves,
              so even if iOS briefly scrolls the visualViewport during
              keyboard transitions, the menu page can never peek through.
              The keyboard-aware sizing is done via padding instead of by
              moving the container.
              Desktop (sm:): the same container becomes a thin translucent
              backdrop and the chat panel below floats out as a fixed
              bottom-right widget. */}
          <div
            onClick={() => setOpen(false)}
            aria-hidden="true"
            style={
              // Reserve space at the top of the overlay so the logo lines up
              // with the visible viewport during iOS keyboard transitions.
              // We deliberately do NOT pad the bottom here — the section's
              // bg-white needs to extend all the way to the bottom of the
              // overlay so the area under the input form blends with the
              // chat panel instead of showing a cream strip.
              isMobile
                ? ({
                    paddingTop: `${vvOffsetTop}px`,
                  } as React.CSSProperties)
                : undefined
            }
            className="fixed inset-0 z-50 flex flex-col bg-cream sm:inset-0 sm:block sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none"
          >
            {/* Logo: mobile only. PNG has ~43% transparent whitespace below
                the artwork; clip it. */}
            <div className="pointer-events-none flex flex-none justify-center pt-2 sm:hidden">
              <div className="block overflow-hidden h-[64px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/shake-shake-logo.png"
                  alt=""
                  width={1536}
                  height={831}
                  className="block h-[112px] w-auto max-w-none"
                />
              </div>
            </div>
            <section
              aria-label={t("chatPanelAria")}
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: `translateY(${dragOffset}px)`,
                transition: draggingRef.current
                  ? "none"
                  : "transform 200ms ease-out",
                // Push the form (last child) up by the keyboard height so it
                // stays right above the iOS keyboard. The section's bg-white
                // fills the padding area below — replacing the old cream
                // strip with a continuous white surface.
                ...(isMobile
                  ? { paddingBottom: `${keyboardInset}px` }
                  : null),
              }}
              className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white sm:fixed sm:top-[195px] sm:bottom-5 sm:right-5 sm:left-auto sm:m-0 sm:h-auto sm:max-h-[calc(100dvh-215px)] sm:w-[min(480px,calc(100vw-2.5rem))] sm:max-w-none sm:flex-none sm:rounded-2xl sm:border sm:border-neutral-300/70 sm:shadow-2xl sm:pointer-events-auto"
            >
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="flex cursor-grab items-start justify-between gap-3 border-b border-neutral-200 px-4 pt-4 pb-3 active:cursor-grabbing"
          >
            <div className="min-w-0">
              <h2 className="font-serif text-2xl leading-tight tracking-tight text-neutral-900">
                {lang === "zh" ? (
                  t("chatHeaderPrefix")
                ) : (
                  <>
                    {t("chatHeaderPrefix")}{" "}
                    <em className="benu-text-glow">
                      {t("chatHeaderHighlight")}
                    </em>
                  </>
                )}
              </h2>
              {preferences.length > 0 && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  {t("chatAvoiding")}: {preferences.join(", ")}
                </p>
              )}
            </div>
            {/* Hide / minimise — collapses the chat back to the launcher */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("chatHideAria")}
              className="-mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="6" y1="13" x2="18" y2="13" />
              </svg>
            </button>
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
              const isLatest = i === messages.length - 1;
              return (
              <div
                key={m.id}
                ref={isLatest ? latestMessageRef : null}
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
                    "px-4 py-2 text-sm leading-relaxed shadow-sm whitespace-pre-line",
                    m.emergency
                      ? "rounded-xl border-2 border-red-600 bg-red-50 text-red-900 font-medium"
                      : "rounded-3xl",
                    !m.emergency && (isUser
                      ? "bg-cantaloupe text-neutral-900"
                      : "bg-white text-neutral-900"),
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {renderInlineMarkdown(m.text)}
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
                          className="flex items-stretch gap-3 rounded-xl border border-neutral-200 bg-white p-2"
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
                                {lang === "zh" && d.nameZh
                                  ? d.nameZh
                                  : d.name}
                              </p>
                              <p className="text-xs text-neutral-600">
                                {formatPrice(d.price)}
                              </p>
                            </div>
                            <p className="line-clamp-2 text-xs text-neutral-500">
                              {lang === "zh" && d.descriptionZh
                                ? d.descriptionZh
                                : d.description}
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
                                  {t("chatContains")}{" "}
                                  {lang === "zh" ? t(f) : f.toLowerCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                          {onSelectDish && (
                            <button
                              type="button"
                              onClick={() => onSelectDish(d.name)}
                              aria-label={`${t("addToCart")} — ${
                                lang === "zh" && d.nameZh
                                  ? d.nameZh
                                  : d.name
                              }`}
                              className="flex h-9 w-9 flex-none items-center justify-center self-center rounded-full bg-cantaloupe text-neutral-900 shadow-sm transition-colors hover:bg-cantaloupe-soft active:bg-cantaloupe-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-cantaloupe-deep/40"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                          )}
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
              {t("chatInputAria")}
            </label>
            <div className="benu-input-glow flex-1 rounded-full">
              <input
                id="chat-widget-input"
                name="chat-message"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                maxLength={2000}
                placeholder={isSending ? t("chatThinking") : t("chatPlaceholder")}
                disabled={isSending}
                className="relative z-[2] block w-full rounded-full border border-cantaloupe-soft bg-white px-4 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-cantaloupe/40 disabled:opacity-60 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className={[
                "rounded-full px-3.5 py-2 text-sm",
                input.trim() && !isSending
                  ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800"
                  : "cursor-not-allowed bg-neutral-200 text-neutral-400",
              ].join(" ")}
              aria-label={t("chatSendAria")}
            >
              {t("chatSend")}
            </button>
          </form>
          </section>
          </div>
        </>
      )}
    </>
  );
}
