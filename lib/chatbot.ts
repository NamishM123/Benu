import { MENU, type MenuItem, spiceLabel } from "./menu";
import { findFlaggedPreferences } from "./preferences";

export type ChatReply = {
  text: string;
  dishes?: MenuItem[];
};

export function answerMenuQuestion(
  question: string,
  selected: string[],
): ChatReply {
  const q = question.trim().toLowerCase();
  if (!q) {
    return {
      text: "Ask me about a dish, spice level, ingredients, or what fits your dietary preferences.",
    };
  }

  const safeMenu = MENU.filter(
    (item) => findFlaggedPreferences(item, selected).length === 0,
  );

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
          ? "Here are a few popular picks that match your preferences:"
          : "Here are a few of our most-loved dishes:",
      dishes,
    };
  }

  if (q.includes("spice") || q.includes("spicy") || q.includes("heat")) {
    const spicy = (selected.length > 0 ? safeMenu : MENU).filter(
      (m) => m.spiceLevel >= 2,
    );
    if (spicy.length === 0) {
      return {
        text: "Nothing matches both 'spicy' and your current preferences — but our Chili Oil dishes are usually a great pick.",
      };
    }
    return { text: "These are our spiciest dishes:", dishes: spicy };
  }

  if (q.includes("vegetarian") || q.includes("vegan") || q.includes("no meat")) {
    const veg = MENU.filter(
      (m) => m.tags.includes("vegetarian") || m.tags.includes("vegan"),
    );
    return { text: "Here are dishes without meat:", dishes: veg };
  }

  if (q.includes("allergen") || q.includes("allerg")) {
    if (selected.length === 0) {
      return {
        text: "Tell me which allergens to avoid by selecting them above, and I'll flag every dish that contains them.",
      };
    }
    const flaggedDishes = MENU.filter(
      (m) => findFlaggedPreferences(m, selected).length > 0,
    );
    return {
      text: `Dishes that may contain ${selected.join(", ")}:`,
      dishes: flaggedDishes,
    };
  }

  const categoryMap: Record<string, string> = {
    appetizer: "Appetizers",
    "noodle soup": "Noodle Soup",
    "dry noodle": "Dry Noodles",
    rice: "Rice",
    drink: "Beverages",
    beverage: "Beverages",
  };
  const matchedCategory = Object.keys(categoryMap).find((c) => q.includes(c));
  if (matchedCategory) {
    const cat = categoryMap[matchedCategory];
    const pool = (selected.length > 0 ? safeMenu : MENU).filter(
      (m) => m.category === cat,
    );
    return {
      text:
        pool.length > 0
          ? `Here's what we have in ${cat}:`
          : `Nothing in ${cat} matches your preferences right now.`,
      dishes: pool,
    };
  }

  const tokens = q.split(/[^a-z]+/).filter(Boolean);
  const directMatch = MENU.filter((m) =>
    tokens.some(
      (t) =>
        m.name.toLowerCase().includes(t) ||
        m.tags.some((tag) => tag.toLowerCase().includes(t)) ||
        m.description.toLowerCase().includes(t),
    ),
  );

  if (directMatch.length > 0) {
    const safeMatch = selected.length
      ? directMatch.filter(
          (m) => findFlaggedPreferences(m, selected).length === 0,
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
          ? "Here are dishes that match:"
          : "Found some matches, but none fit your preferences:",
      dishes: safeMatch.length > 0 ? safeMatch : directMatch,
    };
  }

  return {
    text: "I'm only working from our current menu, and I couldn't find a match. Try asking about a dish, spice level, ingredient, or 'what should I order?'",
  };
}
