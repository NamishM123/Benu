"use client";

import { useMemo, useRef, useState, useEffect } from "react";

type Props = {
  brand?: string;
  options?: string[];
  initialSelected?: string[];
  onConfirm?: (selected: string[]) => void;
};

type MenuItem = {
  name: string;
  price: number;
  category: string;
  description: string;
  spiceLevel: 0 | 1 | 2 | 3;
  tags: string[];
  image: string;
};

type ChatMessage = {
  id: number;
  role: "user" | "bot";
  text: string;
  dishes?: MenuItem[];
};

const DEFAULT_OPTIONS = ["Dairy", "Fish", "Gluten", "Meat", "Nuts", "Soy"];

const MEAT_TAGS = ["beef", "pork", "lamb", "chicken", "fish", "seafood"];

const PREFERENCE_TO_TAGS: Record<string, string[]> = {
  Dairy: ["dairy"],
  Fish: ["fish", "seafood"],
  Gluten: ["gluten", "wheat"],
  Meat: MEAT_TAGS,
  Nuts: ["nuts", "peanut", "tree-nut"],
  Soy: ["soy", "soybean"],
};

const MENU: MenuItem[] = [
  {
    name: "Popcorn Chicken",
    price: 11.99,
    category: "Appetizers",
    description:
      "Crispy bite-sized chicken tossed with cumin, chili, and Sichuan peppercorn salt.",
    spiceLevel: 1,
    tags: ["chicken", "meat", "gluten", "spicy"],
    image:
      "https://source.unsplash.com/featured/?popcorn-chicken",
  },
  {
    name: "Garlic Cucumber",
    price: 8.99,
    category: "Appetizers",
    description:
      "Smashed cucumber with fresh garlic, sesame oil, and a touch of black vinegar.",
    spiceLevel: 0,
    tags: ["vegetarian", "vegan", "dairy-free", "soy", "gluten-free"],
    image: "https://source.unsplash.com/featured/?cucumber-salad",
  },
  {
    name: "Yuba with Celery Salad",
    price: 8.99,
    category: "Appetizers",
    description:
      "Chilled tofu skin and crisp celery in a light soy-sesame dressing.",
    spiceLevel: 0,
    tags: ["vegetarian", "vegan", "soy", "dairy-free"],
    image: "https://source.unsplash.com/featured/?tofu-salad",
  },
  {
    name: "Chili Oil Wontons",
    price: 11.99,
    category: "Appetizers",
    description:
      "Pork wontons drenched in our house chili oil with garlic and scallion.",
    spiceLevel: 2,
    tags: ["pork", "meat", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?chili-wontons",
  },
  {
    name: "Pork and Cabbage Boiled Dumplings",
    price: 15.99,
    category: "Appetizers",
    description:
      "Hand-folded dumplings filled with pork and napa cabbage, gently boiled.",
    spiceLevel: 0,
    tags: ["pork", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?dumplings",
  },
  {
    name: "House Beef Roll",
    price: 12.99,
    category: "Appetizers",
    description:
      "Flaky scallion pancake rolled with thin-sliced beef and hoisin.",
    spiceLevel: 0,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?beef-roll",
  },
  {
    name: "House Cold Cut Beef",
    price: 12.99,
    category: "Appetizers",
    description:
      "Thin slices of slow-braised beef shank served chilled with chili oil.",
    spiceLevel: 1,
    tags: ["beef", "meat", "soy", "spicy", "gluten-free"],
    image: "https://source.unsplash.com/featured/?cold-beef",
  },

  {
    name: "Chili Oil Flat Noodle with Beef Bone",
    price: 21.99,
    category: "Dry Noodles",
    description:
      "Hand-pulled flat noodles tossed in fragrant chili oil, served with a roasted beef bone.",
    spiceLevel: 3,
    tags: ["beef", "meat", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?chili-noodles",
  },
  {
    name: "Regular Chili Oil Flat Noodle",
    price: 14.99,
    category: "Dry Noodles",
    description:
      "Our signature wide hand-pulled noodles in chili oil, garlic, and scallion.",
    spiceLevel: 2,
    tags: ["vegetarian", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?flat-noodle",
  },
  {
    name: "Numbing Spicy Minced Pork Noodle",
    price: 17.99,
    category: "Dry Noodles",
    description:
      "Springy noodles in a numbing Sichuan sauce topped with minced pork.",
    spiceLevel: 3,
    tags: ["pork", "meat", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?spicy-noodles",
  },
  {
    name: "Braised Pork Belly Noodle",
    price: 17.99,
    category: "Dry Noodles",
    description:
      "Tender soy-braised pork belly over hand-pulled noodles with bok choy.",
    spiceLevel: 0,
    tags: ["pork", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?pork-belly-noodle",
  },
  {
    name: "Cumin Onion Lamb Stirred Noodle",
    price: 19.99,
    category: "Dry Noodles",
    description:
      "Wok-tossed noodles with cumin, lamb, sweet onion, and a hint of chili.",
    spiceLevel: 2,
    tags: ["lamb", "meat", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?lamb-noodles",
  },
  {
    name: "Tomato Egg Noodle",
    price: 14.99,
    category: "Dry Noodles",
    description:
      "Comforting tomato and egg sauce over noodles — a homestyle classic.",
    spiceLevel: 0,
    tags: ["vegetarian", "egg", "gluten", "soy", "dairy-free"],
    image: "https://source.unsplash.com/featured/?tomato-noodles",
  },

  {
    name: "House Special Beef Bone Noodle Soup",
    price: 20.99,
    category: "Noodle Soup",
    description:
      "Slow-simmered beef bone broth with hand-pulled noodles and braised brisket.",
    spiceLevel: 0,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?beef-noodle-soup",
  },
  {
    name: "Braised Beef Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Aromatic five-spice broth with tender braised beef and bok choy.",
    spiceLevel: 1,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?braised-beef",
  },
  {
    name: "Pickled Cabbage Beef Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Tangy pickled mustard greens, beef, and noodles in a savory broth.",
    spiceLevel: 1,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?pickled-cabbage-soup",
  },
  {
    name: "Tomato Beef Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Bright tomato broth with tender beef chunks over hand-pulled noodles.",
    spiceLevel: 0,
    tags: ["beef", "meat", "gluten", "soy"],
    image: "https://source.unsplash.com/featured/?tomato-beef-noodle",
  },
  {
    name: "Golden Sour and Spicy Lamb Noodle Soup",
    price: 18.99,
    category: "Noodle Soup",
    description:
      "Pickled-pepper broth with lamb and chewy noodles — bright, sour, and spicy.",
    spiceLevel: 3,
    tags: ["lamb", "meat", "gluten", "soy", "spicy"],
    image: "https://source.unsplash.com/featured/?lamb-soup",
  },

  {
    name: "Tomato Beef over White Rice",
    price: 16.99,
    category: "Rice",
    description:
      "Stewed tomato and beef ladled over steamed jasmine rice.",
    spiceLevel: 0,
    tags: ["beef", "meat", "soy", "gluten-free", "dairy-free"],
    image: "https://source.unsplash.com/featured/?beef-rice",
  },
  {
    name: "Braised Pork over White Rice",
    price: 16.99,
    category: "Rice",
    description:
      "Soy-braised pork belly with marinated egg and greens over jasmine rice.",
    spiceLevel: 0,
    tags: ["pork", "meat", "egg", "soy", "gluten-free", "dairy-free"],
    image: "https://source.unsplash.com/featured/?pork-rice",
  },

  {
    name: "Handmade Fragrance Lemon Tea",
    price: 6.99,
    category: "Beverages",
    description:
      "Hand-pressed lemons, jasmine tea, and a touch of honey.",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "https://source.unsplash.com/featured/?lemon-tea",
  },
  {
    name: "Coffee Meets Milk Tea",
    price: 6.99,
    category: "Beverages",
    description:
      "Smooth espresso layered with creamy Hong Kong–style milk tea.",
    spiceLevel: 0,
    tags: ["dairy", "vegetarian", "gluten-free"],
    image: "https://source.unsplash.com/featured/?milk-tea",
  },
  {
    name: "Coke",
    price: 2.99,
    category: "Beverages",
    description: "Classic Coca-Cola, served chilled.",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "https://source.unsplash.com/featured/?coke",
  },
  {
    name: "Diet Coke",
    price: 2.99,
    category: "Beverages",
    description: "Zero-sugar Diet Coke, served chilled.",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "https://source.unsplash.com/featured/?diet-coke",
  },
  {
    name: "Sprite",
    price: 2.99,
    category: "Beverages",
    description: "Crisp lemon-lime soda, served chilled.",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "https://source.unsplash.com/featured/?sprite",
  },
  {
    name: "Peach Sparkling Water",
    price: 3.99,
    category: "Beverages",
    description: "Lightly sweet peach-infused sparkling water.",
    spiceLevel: 0,
    tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"],
    image: "https://source.unsplash.com/featured/?peach-water",
  },
];

function formatPrice(p: number) {
  return `$${p.toFixed(2)}`;
}

function spiceLabel(level: number) {
  if (level === 0) return "not spicy";
  if (level === 1) return "mildly spicy";
  if (level === 2) return "spicy";
  return "very spicy";
}

function itemContainsPreference(item: MenuItem, preference: string): boolean {
  const flagged = PREFERENCE_TO_TAGS[preference] ?? [
    preference.toLowerCase(),
  ];
  return item.tags.some((t) => flagged.includes(t.toLowerCase()));
}

function findFlaggedPreferences(item: MenuItem, prefs: string[]): string[] {
  return prefs.filter((p) => itemContainsPreference(item, p));
}

function answerMenuQuestion(
  question: string,
  selected: string[]
): { text: string; dishes?: MenuItem[] } {
  const q = question.trim().toLowerCase();
  if (!q) {
    return {
      text: "Ask me about a dish, spice level, ingredients, or what fits your dietary preferences.",
    };
  }

  const safeMenu = MENU.filter(
    (item) => findFlaggedPreferences(item, selected).length === 0
  );

  // Recommendations / what should I order
  if (
    q.includes("recommend") ||
    q.includes("suggest") ||
    q.includes("what should") ||
    q.includes("popular") ||
    q.includes("best")
  ) {
    const pool = selected.length > 0 ? safeMenu : MENU;
    const picks = [
      pool.find((m) => m.name === "House Special Beef Bone Noodle Soup"),
      pool.find((m) => m.name === "Chili Oil Wontons"),
      pool.find((m) => m.name === "Braised Pork Belly Noodle"),
    ].filter(Boolean) as MenuItem[];
    const fallback = pool.slice(0, 3);
    const dishes = picks.length > 0 ? picks : fallback;
    if (dishes.length === 0) {
      return {
        text: "Nothing on the menu fits all of your selected preferences right now. Try removing one to see options.",
      };
    }
    return {
      text:
        selected.length > 0
          ? `Here are a few popular picks that match your preferences:`
          : `Here are a few of our most-loved dishes:`,
      dishes,
    };
  }

  // Spicy / spice level
  if (q.includes("spice") || q.includes("spicy") || q.includes("heat")) {
    const spicy = (selected.length > 0 ? safeMenu : MENU).filter(
      (m) => m.spiceLevel >= 2
    );
    if (spicy.length === 0) {
      return {
        text: "Nothing matches both 'spicy' and your current preferences — but our Chili Oil dishes are usually a great pick.",
      };
    }
    return {
      text: "These are our spiciest dishes:",
      dishes: spicy,
    };
  }

  // Vegetarian / vegan
  if (q.includes("vegetarian") || q.includes("vegan") || q.includes("no meat")) {
    const veg = MENU.filter(
      (m) =>
        m.tags.includes("vegetarian") || m.tags.includes("vegan")
    );
    return {
      text: "Here are dishes without meat:",
      dishes: veg,
    };
  }

  // Allergens
  if (q.includes("allergen") || q.includes("allerg")) {
    if (selected.length === 0) {
      return {
        text: "Tell me which allergens to avoid by selecting them above, and I'll flag every dish that contains them.",
      };
    }
    const flaggedDishes = MENU.filter(
      (m) => findFlaggedPreferences(m, selected).length > 0
    );
    return {
      text: `Dishes that may contain ${selected.join(", ")}:`,
      dishes: flaggedDishes,
    };
  }

  // Match by category
  const categories = ["appetizer", "noodle soup", "dry noodle", "rice", "drink", "beverage"];
  const matchedCategory = categories.find((c) => q.includes(c));
  if (matchedCategory) {
    const categoryMap: Record<string, string> = {
      appetizer: "Appetizers",
      "noodle soup": "Noodle Soup",
      "dry noodle": "Dry Noodles",
      rice: "Rice",
      drink: "Beverages",
      beverage: "Beverages",
    };
    const cat = categoryMap[matchedCategory];
    const pool = (selected.length > 0 ? safeMenu : MENU).filter(
      (m) => m.category === cat
    );
    return {
      text:
        pool.length > 0
          ? `Here's what we have in ${cat}:`
          : `Nothing in ${cat} matches your preferences right now.`,
      dishes: pool,
    };
  }

  // Match by ingredient / tag / dish name
  const tokens = q.split(/[^a-z]+/).filter(Boolean);
  const directMatch = MENU.filter((m) =>
    tokens.some(
      (t) =>
        m.name.toLowerCase().includes(t) ||
        m.tags.some((tag) => tag.toLowerCase().includes(t)) ||
        m.description.toLowerCase().includes(t)
    )
  );

  if (directMatch.length > 0) {
    const safeMatch = selected.length
      ? directMatch.filter(
          (m) => findFlaggedPreferences(m, selected).length === 0
        )
      : directMatch;
    if (directMatch.length === 1) {
      const dish = directMatch[0];
      const flags = findFlaggedPreferences(dish, selected);
      const flagText =
        flags.length > 0
          ? ` Heads up — this dish contains ${flags.join(", ")}.`
          : "";
      return {
        text: `${dish.name} is ${spiceLabel(dish.spiceLevel)}. ${dish.description}${flagText}`,
        dishes: [dish],
      };
    }
    return {
      text:
        safeMatch.length > 0
          ? `Here are dishes that match:`
          : `Found some matches, but none fit your preferences:`,
      dishes: safeMatch.length > 0 ? safeMatch : directMatch,
    };
  }

  return {
    text: "I'm only working from our current menu, and I couldn't find a match. Try asking about a dish, spice level, ingredient, or 'what should I order?'",
  };
}

export default function DietaryPreferencesPage({
  brand = "our restaurant",
  options = DEFAULT_OPTIONS,
  initialSelected = [],
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected)
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "bot",
      text: "Hi! I'm your menu assistant. Ask me about flavors, spice levels, ingredients, or what to order.",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedArray = useMemo(() => Array.from(selected), [selected]);
  const isDisabled = selected.size === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function togglePreference(pref: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pref)) next.delete(pref);
      else next.add(pref);
      return next;
    });
  }

  function handleConfirm() {
    if (isDisabled) return;
    const arr = Array.from(selected);
    console.log("Selected dietary preferences:", arr);
    onConfirm?.(arr);
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      text,
    };
    const reply = answerMenuQuestion(text, selectedArray);
    const botMsg: ChatMessage = {
      id: Date.now() + 1,
      role: "bot",
      text: reply.text,
      dishes: reply.dishes,
    };
    setMessages((m) => [...m, userMsg, botMsg]);
    setInput("");
  }

  return (
    <main
      className="min-h-screen w-full flex justify-center"
      style={{ backgroundColor: "#F5F1E8" }}
    >
      <div className="w-full max-w-[420px] px-6 py-8 flex flex-col">
        <div
          className="mx-auto mb-8 rounded-full bg-neutral-400/60"
          style={{ width: 40, height: 4 }}
          aria-hidden="true"
        />

        <header className="mb-6">
          <h1
            className="font-serif text-4xl tracking-tight text-neutral-900"
            style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
          >
            Dietary Preferences
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Select the items you can&apos;t or don&apos;t want to eat. Items
            that contain significant amounts of these properties will be
            flagged.
          </p>
        </header>

        <section
          aria-label="Dietary preference options"
          className="grid grid-cols-2 gap-3"
        >
          {options.map((opt) => {
            const isSelected = selected.has(opt);
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={isSelected}
                onClick={() => togglePreference(opt)}
                className={[
                  "rounded-2xl py-5 text-lg text-neutral-900",
                  "transition-colors duration-150 ease-out",
                  "focus:outline-none focus:ring-2 focus:ring-neutral-700/30",
                  isSelected
                    ? "ring-1 ring-inset ring-neutral-900/15 shadow-inner"
                    : "",
                ].join(" ")}
                style={{
                  backgroundColor: isSelected ? "#A9BBA0" : "#D8E1D2",
                }}
              >
                {opt}
              </button>
            );
          })}
        </section>

        <section className="mt-8 space-y-3">
          <p className="text-xs leading-relaxed text-neutral-500">
            * At {brand} we use all major allergens in our kitchens, so we
            cannot guarantee that our food is completely free of any allergen.
            If you have a severe allergy, we recommend not ordering from our
            restaurant.
          </p>
          <p className="text-xs leading-relaxed text-neutral-500">
            Please note that your online dietary preferences are not
            communicated to our in-store teams.
          </p>
        </section>

        <div className="mt-8 px-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDisabled}
            className={[
              "w-full rounded-full border border-neutral-400 bg-transparent",
              "py-3 text-sm text-neutral-900",
              "transition-colors duration-150 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-neutral-700/30",
              isDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-neutral-900/5",
            ].join(" ")}
            aria-disabled={isDisabled}
          >
            Confirm preferences
          </button>
        </div>

        <section
          aria-label="Menu assistant"
          className="mt-10 flex flex-col rounded-2xl border border-neutral-300/70 bg-white/60 backdrop-blur-sm"
        >
          <div className="px-4 pt-4 pb-2 border-b border-neutral-200">
            <h2
              className="text-xl tracking-tight text-neutral-900"
              style={{
                fontFamily: "ui-serif, Georgia, 'Times New Roman', serif",
              }}
            >
              Menu assistant
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Ask about taste, spice, ingredients, or what to order.
            </p>
          </div>

          <div className="flex flex-col gap-3 px-4 py-4 max-h-96 overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "self-end max-w-[80%]"
                    : "self-start max-w-[90%]"
                }
              >
                <div
                  className={[
                    "rounded-2xl px-4 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-neutral-900 text-neutral-50 rounded-br-md"
                      : "bg-neutral-100 text-neutral-900 rounded-bl-md",
                  ].join(" ")}
                >
                  {m.text}
                </div>

                {m.dishes && m.dishes.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-2">
                    {m.dishes.map((d) => {
                      const flags = findFlaggedPreferences(d, selectedArray);
                      return (
                        <li
                          key={d.name}
                          className="flex gap-3 rounded-xl bg-white border border-neutral-200 p-2"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={d.image}
                            alt={d.name}
                            className="h-14 w-14 flex-none rounded-lg object-cover bg-neutral-100"
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
                            <p className="text-xs text-neutral-500 line-clamp-2">
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
              placeholder="Ask about a dish or ingredient…"
              className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-700/30"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={[
                "rounded-full px-4 py-2 text-sm",
                input.trim()
                  ? "bg-neutral-900 text-neutral-50 hover:bg-neutral-800"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed",
              ].join(" ")}
              aria-label="Send message"
            >
              Send
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
