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

  // ==== MULTILINGUAL EMERGENCY PHRASES ====
  // Fallback for languages where the user typed in their native script.
  // The LLM is told to respond in their language, but the intercept
  // happens before the LLM call — so we need direct pattern coverage
  // for the most life-critical phrases in major languages.

  // SPANISH
  /\bno\s+puedo\s+respirar\b/i,           // can't breathe
  /\breacción\s+alérgica\b/i,             // allergic reaction
  /\banafilaxia\b/i,
  /\bse\s+(?:está|esta)\s+ahogando\b/i,   // is choking
  /\bllame(?:n)?\s+al?\s+911\b/i,
  /\bambulancia\b/i,
  /\b(?:el|la|mi)\s+\w+\s+(?:murió|muerto|murieron)\b/i, // X died
  /\bme\s+(?:estoy\s+)?muriendo\b/i,      // I'm dying

  // FRENCH
  /\bje\s+ne\s+peux\s+(?:plus\s+)?respirer\b/i,
  /\bréaction\s+allergique\b/i,
  /\banaphylaxie\b/i,
  /\b(?:appelez|appeler)\s+(?:le\s+)?(?:911|15|112|samu)\b/i,
  /\bambulance\b/i,
  /\b(?:il|elle|le\s+client|la\s+cliente)\s+(?:est\s+)?mort(?:e)?\b/i,
  /\bje\s+(?:vais\s+)?meurs\b/i,
  /\bje\s+suis\s+en\s+train\s+de\s+mourir\b/i,

  // RUSSIAN
  /\bне\s+могу\s+дышать\b/iu,             // can't breathe
  /\bаллергическая\s+реакция\b/iu,
  /\bанафилакси/iu,
  /\bвызовите\s+скорую\b/iu,              // call ambulance
  /\bумер(?:ла|ли)?\b/iu,                 // died (m/f/pl)
  /\bя\s+(?:сейчас\s+)?умираю\b/iu,       // I'm dying

  // GERMAN
  /\bich\s+(?:kann|krieg)\s+(?:keine?\s+luft|nicht\s+atmen)\b/i,
  /\ballergische\s+reaktion\b/i,
  /\banaphylax/i,
  /\bnotruf\b/i,
  /\b(?:gestorben|tot|verstorben)\b/i,
  /\bich\s+sterbe\b/i,

  // ITALIAN
  /\bnon\s+(?:riesco|posso)\s+(?:a\s+)?respirare\b/i,
  /\breazione\s+allergica\b/i,
  /\banafilass/i,
  /\bchiama(?:te)?\s+(?:il\s+)?(?:118|112|911|ambulanza)\b/i,
  /\b(?:è|e)\s+morto\b/i,
  /\bsto\s+morendo\b/i,

  // PORTUGUESE
  /\bnão\s+(?:consigo|posso)\s+respirar\b/i,
  /\breação\s+alérgica\b/i,
  /\banafilaxia\b/i,
  /\b(?:chame|liguem?)\s+(?:o\s+)?(?:samu|192|911|ambulância)\b/i,
  /\b(?:morreu|morto|morta)\b/i,
  /\beu\s+(?:estou\s+)?morrendo\b/i,

  // JAPANESE
  /息ができない/u,                          // can't breathe
  /息ができません/u,
  /アレルギー反応/u,                        // allergic reaction
  /アナフィラキシー/u,
  /救急車を呼/u,                           // call ambulance
  /死んだ/u,                               // died
  /死にそう/u,                             // about to die

  // KOREAN
  /숨을\s*쉴\s*수\s*없/u,                  // can't breathe
  /알레르기\s*반응/u,
  /아나필락시스/u,
  /구급차/u,                               // ambulance
  /죽었/u,                                 // died
  /죽을\s*것\s*같/u,                        // feels like dying

  // CHINESE
  /(?:我\s*)?喘不过气/u,                    // can't breathe
  /(?:我\s*)?无法呼吸/u,
  /过敏反应/u,                             // allergic reaction
  /过敏性休克/u,
  /叫\s*救护车/u,
  /打\s*120\b/u,
  /已经\s*死了/u,
  /我\s*快\s*死了/u,

  // ARABIC
  /لا\s+(?:أستطيع|اقدر)\s+(?:على\s+)?التنفس/u,  // can't breathe
  /حساسية/u,                               // allergy / allergic
  /اتصلوا?\s+ب?(?:الإسعاف|911|112)/u,
  /(?:مات|توفي)/u,                          // died
  /أنا\s+أموت/u,                            // I'm dying

  // HINDI
  /साँस\s+नहीं\s+ले/u,                      // can't breathe
  /एलर्जी\s+प्रतिक्रिया/u,
  /एम्बुलेंस\s+बुला/u,
  /मर\s+गया/u,                              // died
  /मैं\s+मर\s+रहा/u,                        // I'm dying

  // THAI
  /หายใจไม่ออก/u,
  /แพ้\s+อย่างรุนแรง/u,
  /โทร\s*1669/u,
  /ตาย\s*แล้ว/u,
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
