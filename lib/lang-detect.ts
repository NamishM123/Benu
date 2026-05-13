// Lightweight server-side language detection. Used to pick the correct
// canned emergency message — the LLM handles non-emergency multilingual
// responses on its own, but the emergency intercept bypasses the LLM,
// so we need to detect the user's language ourselves.
//
// Strategy:
// 1. Non-Latin scripts: detect by Unicode block. Korean, Japanese,
//    Chinese, Arabic, Hebrew, Cyrillic, Devanagari, Thai, Bengali,
//    Greek — each has a recognizable range.
// 2. Latin script: keyword frequency. Look for very common
//    function-words ("je", "tu", "ich", "der", "el", etc.) and pick
//    the language with the most matches above a threshold.
// 3. Fallback: English.

const SCRIPT_RANGES: Array<{ lang: string; re: RegExp }> = [
  // Korean Hangul (must come before zh — hangul ranges don't overlap CJK)
  { lang: "ko", re: /[가-힯]/ },
  // Japanese hiragana + katakana (distinguishes Japanese from Chinese,
  // even though Japanese also uses kanji from the CJK block).
  { lang: "ja", re: /[぀-ゟ゠-ヿ]/ },
  // Chinese (CJK Unified Ideographs). Matched only after kana check.
  { lang: "zh", re: /[一-鿿]/ },
  // Cyrillic (Russian, Ukrainian, Bulgarian, Serbian, …)
  { lang: "ru", re: /[Ѐ-ӿ]/ },
  // Arabic
  { lang: "ar", re: /[؀-ۿݐ-ݿ]/ },
  // Hebrew
  { lang: "he", re: /[֐-׿]/ },
  // Devanagari (Hindi, Marathi)
  { lang: "hi", re: /[ऀ-ॿ]/ },
  // Bengali
  { lang: "bn", re: /[ঀ-৿]/ },
  // Thai
  { lang: "th", re: /[฀-๿]/ },
  // Greek
  { lang: "el", re: /[Ͱ-Ͽ]/ },
];

const LATIN_KEYWORDS: Record<string, string[]> = {
  fr: ["je", "tu", "le", "la", "les", "des", "une", "pour", "avec", "mais", "donc", "j'ai", "c'est", "parce", "que", "voici", "voilà", "oui", "non", "merci", "sans", "très", "moi", "vous", "dans", "sur", "ça", "qu'il", "n'est", "bœuf", "viande"],
  es: ["yo", "tú", "el", "la", "los", "las", "una", "para", "con", "pero", "sí", "gracias", "por", "qué", "que", "porque", "sin", "también", "muy", "estoy", "estás", "carne", "puedo"],
  de: ["ich", "du", "der", "die", "das", "den", "dem", "für", "mit", "aber", "ja", "nein", "danke", "und", "auch", "nicht", "haben", "sind", "ist", "sehr", "kann", "möchte", "fleisch"],
  it: ["io", "tu", "il", "lo", "gli", "le", "una", "per", "con", "ma", "sì", "grazie", "che", "perché", "senza", "anche", "molto", "sono", "ho", "carne", "vorrei"],
  pt: ["eu", "tu", "você", "o", "a", "os", "as", "uma", "para", "com", "mas", "sim", "não", "obrigado", "obrigada", "que", "porque", "sem", "muito", "estou", "carne"],
  nl: ["ik", "jij", "de", "het", "een", "voor", "met", "maar", "ja", "nee", "dank", "dat", "omdat", "zonder", "vlees", "heb"],
  pl: ["ja", "ty", "to", "na", "z", "ale", "tak", "nie", "dziękuję", "że", "bez", "mam", "jest", "mięso"],
  vi: ["tôi", "bạn", "có", "không", "là", "với", "cho", "để", "tại", "vì", "thịt", "ăn", "muốn", "cảm", "ơn"],
  tr: ["ben", "sen", "için", "ile", "ama", "evet", "hayır", "teşekkür", "et", "olmak", "var", "yemek", "istiyorum"],
  id: ["saya", "kamu", "dia", "untuk", "dengan", "tetapi", "ya", "tidak", "terima", "kasih", "tanpa", "daging", "makan"],
};

// Farsi-only letters within the Perso-Arabic block. If any of these are
// present, the text is Persian (Farsi / Dari / Tajik written in Arabic
// script), not Arabic — Arabic itself never uses پ چ ژ گ. We special-case
// this BEFORE the general script-range scan because the Arabic range
// regex also matches Farsi letters (it'd otherwise win on character
// count and mis-label every Farsi message as Arabic).
const FARSI_ONLY_RE = /[پچژگ]/;

export function detectLanguage(text: string): string {
  if (!text) return "en";

  // Farsi short-circuit — even one Farsi-only letter is unambiguous.
  if (FARSI_ONLY_RE.test(text)) return "fa";

  // Sample longer messages by character count to avoid weighting toward
  // a single CJK character in an otherwise English message.
  let bestScript: string | null = null;
  let bestScriptCount = 0;
  for (const { lang, re } of SCRIPT_RANGES) {
    const matches = text.match(new RegExp(re, "g"));
    const count = matches ? matches.length : 0;
    if (count > bestScriptCount && count >= 2) {
      bestScriptCount = count;
      bestScript = lang;
    }
  }
  if (bestScript) return bestScript;

  // Latin-script languages: keyword frequency.
  const lower = " " + text.toLowerCase().replace(/[^\p{L}\p{N}'\s]/gu, " ") + " ";
  let bestLang = "en";
  let bestScore = 0;
  for (const [lang, keywords] of Object.entries(LATIN_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(" " + kw + " ")) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }
  // Require at least 2 keyword matches before deciding non-English —
  // a single "je" in an otherwise English sentence shouldn't flip the
  // detection.
  return bestScore >= 2 ? bestLang : "en";
}
