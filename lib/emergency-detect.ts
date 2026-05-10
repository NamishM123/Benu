// Detect medical-emergency phrasing in chat text. When this returns true,
// the chat MUST bypass the LLM entirely and respond with a fixed
// emergency-instructions message — no menu suggestions, no friendly
// "what flavors are you in the mood for?" reply.
//
// Bias: aggressive over-detection. A false positive means the customer
// sees a "if this is an emergency, call 911" message they can ignore. A
// false negative means a customer in anaphylaxis is told to pick noodles.
// We choose the false positive every time.

const STRONG_PATTERNS: RegExp[] = [
  // Active allergic reaction
  /\ballergic\s+reaction\b/i,
  /\bhaving\s+(?:an?\s+)?reaction\b/i,
  /\banaphylax(?:is|ic)\b/i,

  // Airway / breathing
  /\bcan'?t\s+breathe\b/i,
  /\bcannot\s+breathe\b/i,
  /\bcan\s+not\s+breathe\b/i,
  /\b(?:trouble|difficulty|hard)\s+breathing\b/i,
  /\bthroat\s+(?:closing|tight|swelling|swollen|is\s+closing)\b/i,
  /\bchok(?:ing|ed)\b/i,

  // Swelling
  /\b(?:tongue|lips?|face|mouth)\s+(?:is\s+)?(?:swelling|swollen)\b/i,
  /\bswollen\s+(?:tongue|lips?|face|mouth|throat)\b/i,
  /\bhives\s+(?:all\s+over|everywhere|spreading)\b/i,

  // Direct medical emergency vocabulary
  /\bepi[-\s]?pen\b/i,
  /\bepinephrine\b/i,
  /\bcall\s+911\b/i,
  /\bcall\s+999\b/i,
  /\bcall\s+(?:an?\s+)?ambulance\b/i,
  /\bneed\s+(?:an?\s+)?ambulance\b/i,
  /\bemergency\s+room\b/i,

  // Death / collapse language
  /\b(?:i'?m|i\s+am|i)\s+dying\b/i,
  /\bgoing\s+to\s+die\b/i,
  /\bgonna\s+die\b/i,
  /\bpassing\s+out\b/i,
  /\bblack(?:ing)?\s+out\b/i,
  /\bfaint(?:ing)?\b/i,

  // Severe symptoms
  /\bchest\s+(?:pain|tight|hurting|hurts)\b/i,
];

// Softer signals — alone these wouldn't trigger, but if combined with an
// allergy / reaction context they do.
const ALLERGY_CONTEXT_RE =
  /\ballerg(?:ic|y|ies)\b|\breaction\b|\bate\s+(?:it|that|the)\b|\bjust\s+ate\b/i;
const HELP_DISTRESS_RE =
  /\b(?:help\s+me|need\s+help|please\s+help|get\s+help|getting\s+worse|feel\s+(?:awful|terrible|sick|bad)|throwing\s+up|vomiting|nausea(?:ted|us)?)\b/i;

export function isMedicalEmergency(text: string): boolean {
  if (!text) return false;

  for (const re of STRONG_PATTERNS) {
    if (re.test(text)) return true;
  }

  // Combo: any distress/help-seeking phrase together with an allergy
  // context (e.g. "I just ate it and I need help") = treat as emergency.
  if (ALLERGY_CONTEXT_RE.test(text) && HELP_DISTRESS_RE.test(text)) {
    return true;
  }

  return false;
}
