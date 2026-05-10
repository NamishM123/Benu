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

const CUSTOM_AVOIDANCE_PATTERNS: RegExp[] = [
  // "allergic to X", "allergy to X"
  /\ballerg(?:ic|y|ies)\s+to\s+([a-z][a-z\-\s]{2,30}?)(?=\s*(?:[,.!?;]|\sand\s|\sor\s|\sbut\s|\sso\s|$))/gi,
  // "can't / cannot have/eat/tolerate X"
  /\b(?:can'?t|cannot|can\s+not)\s+(?:have|eat|tolerate|do)\s+([a-z][a-z\-\s]{2,30}?)(?=\s*(?:[,.!?;]|\sand\s|\sor\s|\sbut\s|\sso\s|$))/gi,
  // "don't eat X"
  /\b(?:don'?t|do\s+not)\s+eat\s+([a-z][a-z\-\s]{2,30}?)(?=\s*(?:[,.!?;]|\sand\s|\sor\s|\sbut\s|\sso\s|$))/gi,
  // "avoid X" / "avoiding X"
  /\bavoid(?:ing)?\s+([a-z][a-z\-\s]{2,30}?)(?=\s*(?:[,.!?;]|\sand\s|\sor\s|\sbut\s|\sso\s|$))/gi,
  // "without X"
  /\bwithout\s+([a-z][a-z\-\s]{2,30}?)(?=\s*(?:[,.!?;]|\sand\s|\sor\s|\sbut\s|\sso\s|$))/gi,
  // "no X" / "hold the X" / "skip the X"
  /\b(?:no|hold\s+the|skip\s+the)\s+([a-z][a-z\-]{2,30})\b/gi,
  // "X-free" / "X free"
  /\b([a-z][a-z\-]{2,30})[-\s]free\b/gi,
  // "intolerant to X" / "sensitive to X"
  /\b(?:intolerant|sensitive)\s+to\s+([a-z][a-z\-\s]{2,30}?)(?=\s*(?:[,.!?;]|\sand\s|\sor\s|\sbut\s|\sso\s|$))/gi,
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
      // Split on conjunctions that may have been included anyway
      // ("soy and cucumber" → ["soy", "cucumber"])
      const parts = raw.split(/\s+(?:and|or|plus|with)\s+|\s*,\s*/);
      for (const part of parts) {
        const cleaned = part.trim().replace(/[^a-z\-\s]/gi, "").trim();
        if (!cleaned) continue;
        if (cleaned.length < 3 || cleaned.length > 30) continue;
        // Reject phrases longer than 3 words — likely captured a clause
        const words = cleaned.split(/\s+/);
        if (words.length > 3) continue;
        // Reject if every word is a stop-word
        if (words.every((w) => STOP_WORDS.has(w))) continue;
        // Strip leading stop-words ("a/the/some cucumber" → "cucumber")
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

// Returns true if a dish should be filtered out because it contains one
// of the custom allergens the user named. We check the dish name,
// description, and tags for any allergen substring — over-filter on
// purpose. "cucumber" matches "Garlic Cucumber".
export function dishMatchesCustomAllergen(
  dish: { name: string; description: string; tags: string[] },
  customAllergens: string[],
): string[] {
  if (!customAllergens.length) return [];
  const name = dish.name.toLowerCase();
  const desc = dish.description.toLowerCase();
  const tags = dish.tags.map((t) => t.toLowerCase());
  const hits: string[] = [];
  for (const a of customAllergens) {
    const al = a.toLowerCase();
    if (
      name.includes(al) ||
      desc.includes(al) ||
      tags.some((t) => t.includes(al))
    ) {
      hits.push(a);
    }
  }
  return hits;
}
