// Detect allergies / dietary avoidances stated in plain chat text. Returns
// preference labels matching DEFAULT_OPTIONS in lib/preferences.ts so they
// can be merged into the user's existing preferences and used for hard
// allergen filtering before any dish is shown.
//
// SAFETY RULE: bias toward over-detection. A false positive (flagging an
// allergen the user doesn't actually have) is annoying. A false negative
// (recommending soy to a soy-allergic guest) is dangerous. When in doubt,
// flag it.

const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  Dairy: ["dairy", "milk", "cheese", "butter", "lactose", "cream", "yogurt", "yoghurt"],
  Fish: ["fish", "seafood", "shellfish", "shrimp", "prawn", "crab", "lobster", "oyster", "clam", "mussel", "scallop"],
  Gluten: ["gluten", "wheat", "celiac", "coeliac"],
  Meat: ["meat", "beef", "pork", "lamb", "chicken", "poultry"],
  Nuts: ["nut", "nuts", "peanut", "peanuts", "almond", "almonds", "cashew", "cashews", "walnut", "walnuts", "tree nut", "tree-nut", "pistachio", "hazelnut", "pecan"],
  Soy: ["soy", "soya", "soybean", "soybeans", "tofu", "edamame"],
};

const AVOIDANCE_RE =
  /\b(?:allerg(?:ic|y|ies)?|intoleran(?:t|ce)|sensitiv(?:e|ity)|can'?t\s+(?:have|eat|do|tolerate)|cannot\s+(?:have|eat|do|tolerate)|don'?t\s+(?:eat|do)|do\s+not\s+(?:eat|do)|avoid(?:ing)?|without|hold\s+the|skip\s+the|hate|exclud(?:e|ing)|free\s+of|stay\s+away\s+from|never\s+eat)\b/i;

const NEGATION_RE =
  /\bnot\s+allergic\b|\bnot\s+(?:intolerant|sensitive)\b|\bi\s+(?:can|do|love|like|enjoy|want)\s+(?:have|eat)?/i;

export function extractAllergensFromText(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const detected = new Set<string>();

  // Strict diet labels — vegan implies no meat, dairy, or fish; vegetarian
  // implies no meat or fish.
  if (/\bvegan\b/i.test(text)) {
    detected.add("Meat");
    detected.add("Dairy");
    detected.add("Fish");
  }
  if (/\bvegetarian\b/i.test(text) || /\bno\s+meat\b/i.test(text)) {
    detected.add("Meat");
    detected.add("Fish");
  }

  // "X-free" patterns are unambiguous avoidance — flag without needing a
  // separate avoidance verb (e.g. "dairy-free", "gluten free").
  for (const [allergen, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
    for (const kw of keywords) {
      if (new RegExp(`\\b${escapeRegex(kw)}[-\\s]free\\b`, "i").test(lower)) {
        detected.add(allergen);
        break;
      }
    }
  }

  // "no X" / "without X" / "hold the X" — direct exclusion phrasing.
  for (const [allergen, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
    for (const kw of keywords) {
      if (
        new RegExp(`\\b(?:no|without|hold\\s+the|skip\\s+the)\\s+${escapeRegex(kw)}\\b`, "i").test(lower)
      ) {
        detected.add(allergen);
        break;
      }
    }
  }

  // General avoidance: if the message contains an avoidance verb AND mentions
  // an allergen keyword, flag it. The negation check filters out "I'm not
  // allergic to soy" or "I love dairy".
  const hasAvoidance = AVOIDANCE_RE.test(text);
  const hasNegation = NEGATION_RE.test(text);

  if (hasAvoidance && !hasNegation) {
    for (const [allergen, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
      for (const kw of keywords) {
        if (new RegExp(`\\b${escapeRegex(kw)}\\b`, "i").test(lower)) {
          detected.add(allergen);
          break;
        }
      }
    }
  }

  return Array.from(detected);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
