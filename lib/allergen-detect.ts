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

// "a+l+erg" matches "alerg", "allerg", "aalerg" — handles common typos
// like "alergic" (single L) which the previous strict pattern missed.
const AVOIDANCE_RE =
  /\b(?:a+l+erg(?:ic|y|ies)?|intoleran(?:t|ce)|sensitiv(?:e|ity)|can'?t\s+(?:have|eat|do|tolerate)|cannot\s+(?:have|eat|do|tolerate)|don'?t\s+(?:eat|do)|do\s+not\s+(?:eat|do)|avoid(?:ing)?|without|hold\s+the|skip\s+the|hate|exclud(?:e|ing)|free\s+of|stay\s+away\s+from|never\s+eat|gives?\s+me|makes?\s+me\s+(?:itch|swell|sneeze|sick|nauseous|puffy|hives|breakout)|breakout|hives|puffy|swelling)\b/i;

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

// Custom-allergen extractor: pulls free-text ingredients the user said
// they can't have (cucumber, sesame, egg, mushroom, cilantro, …) — not
// just the six standard categories. The chat had no defense for these.
//
// Strategy: look for explicit avoidance phrases ("allergic to X", "can't
// have X", "no X", "without X", "X-free") and capture whatever noun
// follows. Stop at conjunctions/punctuation so "allergic to soy and
// cucumber" returns ["soy", "cucumber"]. Filtered for stop-words and
// max length so we don't grab whole sentences.

const STOP_WORDS = new Set([
  "it", "that", "this", "those", "these", "anything", "something",
  "everything", "nothing", "stuff", "things", "food", "foods", "any",
  "some", "many", "much", "lots", "a", "an", "the", "and", "or", "but",
  "to", "of", "at", "for", "with", "from", "in", "on", "be", "is",
  "are", "was", "were", "have", "has", "had", "do", "does", "did",
  "spicy", "hot", "cold", "warm", "fresh", "fried", "baked", "boiled",
  "steamed", "raw", "cooked",
]);

// Capture groups end at sentence-ending punctuation, NOT at "and"/"or" —
// so "allergic to potato and tofu" captures "potato and tofu" as one
// run, and the post-split handles the conjunction. Allow commas inside
// the capture so "allergic to peanuts, sesame, and shrimp" works.
const STOP = "(?=\\s*(?:[.!?;]|\\sso\\s|\\sbut\\s|$))";
const CUSTOM_AVOIDANCE_PATTERNS: RegExp[] = [
  // "allergic to X", "alergic to X" (typo) — fuzzy a+l+erg.
  new RegExp(
    `\\ba+l+erg(?:ic|y|ies)?\\s+to\\s+([a-z][a-z\\-\\s,]{2,60}?)${STOP}`,
    "gi",
  ),
  // "can't / cannot have/eat/tolerate X"
  new RegExp(
    `\\b(?:can'?t|cannot|can\\s+not)\\s+(?:have|eat|tolerate|do)\\s+([a-z][a-z\\-\\s,]{2,60}?)${STOP}`,
    "gi",
  ),
  // "don't eat X"
  new RegExp(
    `\\b(?:don'?t|do\\s+not)\\s+eat\\s+([a-z][a-z\\-\\s,]{2,60}?)${STOP}`,
    "gi",
  ),
  // "avoid X" / "avoiding X"
  new RegExp(
    `\\bavoid(?:ing)?\\s+([a-z][a-z\\-\\s,]{2,60}?)${STOP}`,
    "gi",
  ),
  // "without X"
  new RegExp(
    `\\bwithout\\s+([a-z][a-z\\-\\s,]{2,60}?)${STOP}`,
    "gi",
  ),
  // "no X" / "hold the X" / "skip the X" — single word/short phrase
  /\b(?:no|hold\s+the|skip\s+the)\s+([a-z][a-z\-]{2,30}(?:\s+(?:and|or)\s+[a-z][a-z\-]{2,30})*)\b/gi,
  // "X-free" / "X free"
  /\b([a-z][a-z\-]{2,30})[-\s]free\b/gi,
  // "intolerant to X" / "sensitive to X"
  new RegExp(
    `\\b(?:intolerant|sensitive)\\s+to\\s+([a-z][a-z\\-\\s,]{2,60}?)${STOP}`,
    "gi",
  ),
  // SYMPTOM-BASED: "X gives me [symptom]", "X makes me [symptom]"
  /\b([a-z][a-z\-]{2,25})\s+(?:gives?|makes?|cause[sd]?)\s+(?:me|my\s+\w+)\s+(?:itch|itchy|swell|swelling|swollen|puffy|hives|rash|sneeze|sneezing|sick|nauseous|breakout|wheeze)/gi,
  // SYMPTOM-BASED: "after eating X" / "when I eat X" / "if I eat X"
  /\b(?:after\s+eating|when\s+i\s+eat|if\s+i\s+eat|from\s+eating)\s+([a-z][a-z\-]{2,25})\b/gi,
  // SYMPTOM-BASED: "X but my [body part] gets [symptom]"
  // ("I want pork but my eye gets puffy" → "pork")
  /\b([a-z][a-z\-]{2,25})\s+but\s+(?:my|i)\s+\w+\s+(?:get|gets|become|becomes|turn|turns|swell|swells|puff|puffs|itch|itches)/gi,
];

export function extractCustomAllergens(text: string): string[] {
  if (!text) return [];
  // Skip entirely on negation ("I'm not allergic to X" / "I love X")
  if (NEGATION_RE.test(text)) return [];

  const detected = new Set<string>();
  for (const pat of CUSTOM_AVOIDANCE_PATTERNS) {
    pat.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pat.exec(text)) !== null) {
      const raw = m[1].trim().toLowerCase();
      // Split on commas AND on "and"/"or"/"plus"/"with" conjunctions.
      // "potato, tofu, and shrimp" → ["potato", "tofu", "and shrimp"];
      // the post-clean step then strips the leading "and"/"or" so the
      // final list is ["potato", "tofu", "shrimp"].
      const parts = raw.split(/\s*,\s*|\s+(?:and|or|plus|with)\s+/);
      for (const part of parts) {
        const cleaned = part
          .trim()
          .replace(/^(?:and|or|plus|with)\s+/i, "")
          .replace(/[^a-z\-\s]/gi, "")
          .trim();
        if (!cleaned) continue;
        if (cleaned.length < 3 || cleaned.length > 30) continue;
        const words = cleaned.split(/\s+/);
        if (words.length > 3) continue;
        if (words.every((w) => STOP_WORDS.has(w))) continue;
        while (words.length > 1 && STOP_WORDS.has(words[0])) words.shift();
        const final = words.join(" ");
        if (final.length < 3) continue;
        if (STOP_WORDS.has(final)) continue;
        detected.add(final);
      }
    }
  }
  return Array.from(detected);
}

// Strip common English plural suffixes so "potato" and "potatoes" are
// treated as the same allergen when matching. Also strips "es", "ies"
// → "y" (berries → berry).
function stem(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.length <= 3) return w;
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

// Returns the list of allergens (from the user-named list) that appear
// in this dish's name/description/tags. We:
//   1. Stem both the allergen and the matched word so "potato" matches
//      "potatoes" and vice versa.
//   2. Use word-boundary regex (not bare `includes`) so "egg" doesn't
//      match "eggplant" — but "potato" still matches "potatoes" via
//      the stem step.
// Over-flag on purpose: "cucumber" matches "Garlic Cucumber". A
// false-positive filter is fine; a missed allergen ships an EpiPen call.
export function dishMatchesCustomAllergen(
  dish: { name: string; description: string; tags: string[] },
  customAllergens: string[],
): string[] {
  if (!customAllergens.length) return [];
  const haystack = `${dish.name} ${dish.description} ${dish.tags.join(" ")}`.toLowerCase();
  const hits: string[] = [];
  for (const a of customAllergens) {
    const stemmed = stem(a);
    if (stemmed.length < 3) continue;
    // Word-boundary, then the stem, then optional plural suffix.
    const pattern = new RegExp(
      `\\b${escapeRegex(stemmed)}(?:s|es|ies)?\\b`,
      "i",
    );
    if (pattern.test(haystack)) {
      hits.push(a);
    }
  }
  return hits;
}

// Pull every allergen the user has stated across the whole conversation.
// Scans both the user's messages AND the bot's prior warnings — when
// the bot says "you mentioned being allergic to potato and tofu", we
// extract "potato" and "tofu" too, so a typo in the user's original
// message ("alergic") doesn't cost us the constraint.
export function extractAllergensFromConversation(
  history: { role: "user" | "bot"; text: string }[],
): { categories: string[]; ingredients: string[] } {
  const categories = new Set<string>();
  const ingredients = new Set<string>();

  for (const msg of history) {
    if (!msg.text) continue;
    // User messages: full detection (vegan, X-free, "no X", avoidance verbs).
    // Bot messages: also scan, because the bot often paraphrases the
    // user's allergy ("since you said you're allergic to potato"), and
    // that paraphrase is sometimes cleaner than the original (no typos).
    for (const c of extractAllergensFromText(msg.text)) categories.add(c);
    for (const i of extractCustomAllergens(msg.text)) ingredients.add(i);
  }

  return {
    categories: Array.from(categories),
    ingredients: Array.from(ingredients),
  };
}
