// Detect medical-emergency phrasing in chat text. When this returns true,
// the chat MUST bypass the LLM entirely and respond with a fixed
// emergency-instructions message — no menu suggestions, no friendly
// "what flavors are you in the mood for?" reply.
//
// CONSERVATIVE BIAS: only trigger on phrasing that is unambiguously a
// medical emergency. The previous version had combo logic that could
// fire on unrelated text ("Hi sick my dic" was wrongly flagged), and
// false positives erode the signal — if the customer sees the 911
// banner on every other message they will tune it out, defeating the
// purpose of the intercept entirely.
//
// We accept that some real emergencies will be missed by this regex.
// That's OK because the LLM, the system prompt, and the dish hard
// filter all have separate safeguards. The intercept's job is to
// bypass the LLM only when we are CERTAIN.

const STRONG_PATTERNS: RegExp[] = [
  // Active anaphylaxis / reaction language. Specific multi-word phrases
  // only — bare "reaction" is too generic.
  /\ballergic\s+reaction\b/i,
  /\bhaving\s+(?:an?\s+)?allergic\s+reaction\b/i,
  /\banaphylax(?:is|ic)\b/i,
  /\banaphylactic\s+shock\b/i,

  // Airway / breathing — every variant requires the breathing/airway word
  /\bcan'?t\s+breathe\b/i,
  /\bcannot\s+breathe\b/i,
  /\bcan\s+not\s+breathe\b/i,
  /\b(?:trouble|difficulty|hard\s+time)\s+breathing\b/i,
  /\bthroat\s+(?:is\s+)?(?:closing|tight|swelling|swollen|closing\s+up)\b/i,

  // Visible swelling of allergy-prone areas — requires both body part
  // and swelling verb together
  /\b(?:tongue|lips?|face|mouth|throat)\s+(?:is\s+|are\s+)?(?:swelling|swollen|closing)\b/i,
  /\bswollen\s+(?:tongue|lips?|face|mouth|throat)\b/i,

  // Direct medical-emergency vocabulary
  /\bepi[-\s]?pen\b/i,
  /\bepinephrine\b/i,
  /\bcall\s+911\b/i,
  /\bcall\s+999\b/i,
  /\bcall\s+(?:an?\s+)?ambulance\b/i,
  /\bneed\s+(?:an?\s+)?ambulance\b/i,
  /\bemergency\s+room\b/i,
  /\bgo(?:ing)?\s+to\s+(?:the\s+)?(?:er|emergency\s+room|hospital)\b/i,

  // DEATH / KILLED — any mention in a food/restaurant chat must be
  // treated as a serious incident report. Yes, "you killed me" is
  // sometimes hyperbolic in casual chat, but in a restaurant ordering
  // assistant the cost of treating it as serious is a banner the user
  // can read past; the cost of NOT treating it as serious is a
  // generic "I'm sorry to hear that" reply to a death report. We
  // pick the safer side every time.
  /\bkilled\s+(?:me|him|her|them|someone|somebody|a\s+(?:client|guest|customer|person)|the\s+(?:client|guest|customer|person))\b/i,
  /\byou\s+(?:just\s+)?killed\b/i,
  /\b(?:i|he|she|they|the\s+(?:client|guest|customer|person)|someone|somebody|my\s+\w+)\s+died\b/i,
  /\bdied\s+(?:from|because|after\s+eating|of\s+an\s+allergic|of\s+anaphyl)/i,
  /\bdeath\s+(?:from|caused\s+by|due\s+to)\s+(?:the\s+)?(?:food|meal|dish|allerg)/i,
  /\bgoing\s+to\s+die\b/i,
  /\bgonna\s+die\b/i,

  // Active loss-of-consciousness language
  /\bpassing\s+out\b/i,
  /\bblack(?:ing)?\s+out\b/i,
];

// Combo: an allergy-context noun + an active-distress phrase. Both
// must be specific so casual chat doesn't trip them — e.g. just "sick"
// is not enough; "I just ate it and feel sick" is. Bare "I'm dying"
// is removed entirely (too easily hyperbolic — "I'm dying for some
// noodles" should not flash 911 instructions).
const ALLERGY_CONTEXT_RE =
  /\ballergic\s+reaction\b|\bhaving\s+a\s+reaction\b|\bjust\s+ate\b|\bafter\s+eating\b/i;
const HELP_DISTRESS_RE =
  /\bcan'?t\s+breathe\b|\b(?:throat|tongue|lips?|face)\s+(?:is\s+|are\s+)?(?:swelling|swollen|closing)\b|\bfeel\s+(?:awful|terrible|like\s+i'?m\s+dying)\b|\bvomit(?:ing)?\b|\bthrowing\s+up\b/i;

export function isMedicalEmergency(text: string): boolean {
  if (!text) return false;

  for (const re of STRONG_PATTERNS) {
    if (re.test(text)) return true;
  }

  if (ALLERGY_CONTEXT_RE.test(text) && HELP_DISTRESS_RE.test(text)) {
    return true;
  }

  return false;
}
