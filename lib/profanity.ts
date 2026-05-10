/**
 * Shared profanity / slur guard. Used by:
 *   - ChatWidget — gate user messages to the bot
 *   - ItemDetailSheet — gate special-request text the kitchen will read
 *
 * The check has to defeat common obfuscation tricks (digit substitution,
 * symbol substitution, dots/spaces between letters, accented homoglyphs,
 * stretched letters) without false-flagging legitimate menu words like
 * "spice", "shiitake", "country".
 *
 * Approach:
 *   1. Build two normalised forms of the input:
 *        - `light`  — Unicode-normalised, lowercased, with digit leetspeak
 *                     mapped to letters (1→i, 3→e, …). Whitespace and
 *                     punctuation are preserved so word boundaries still
 *                     work.
 *        - `dense`  — Aggressive form: also maps obfuscation symbols
 *                     (!|@$+) to letters, drops everything that isn't a
 *                     letter, and collapses runs of 3+ identical letters.
 *                     Used for catching "n.i.g.g.a" / "n!gga" / "fuuuck".
 *   2. Run word-boundary regexes (against `light`) for terms that share
 *      substrings with real food / English words (spic ⊂ spice,
 *      shit ⊂ shiitake, fuk ⊂ fukushima — though that's not on the menu).
 *   3. Run substring checks (against `dense`) for slurs unambiguous enough
 *      that a substring hit is almost certainly intentional.
 *   4. Run substring checks for Chinese terms against the lowercased raw
 *      input — CJK chars don't survive the letter-only normalisations.
 */

const DIGIT_LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "9": "g",
};

const SYMBOL_LEET: Record<string, string> = {
  "!": "i",
  "|": "i",
  "@": "a",
  "$": "s",
  "+": "t",
  "(": "c",
};

function lightNormalise(input: string): string {
  const nfkd = input.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  let s = nfkd.toLowerCase();
  s = s.replace(/[01345789]/g, (c) => DIGIT_LEET[c] ?? c);
  // Symbol leet too, so "sh!t" / "b!tch" / "f@g" hit word-boundary terms.
  // We skip "(" here because it's common in legitimate punctuation.
  s = s.replace(/[!|@$+]/g, (c) => SYMBOL_LEET[c] ?? c);
  return s;
}

function denseNormalise(input: string): string {
  const nfkd = input.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  let s = nfkd.toLowerCase();
  s = s.replace(/[01345789]/g, (c) => DIGIT_LEET[c] ?? c);
  s = s.replace(/[!|@$+(]/g, (c) => SYMBOL_LEET[c] ?? c);
  s = s.replace(/[^a-z]/g, "");
  s = s.replace(/(.)\1{2,}/g, "$1");
  return s;
}

// Terms checked with `\b...\b` against the light form. Used for words that
// can appear as substrings of legitimate vocabulary — boundaries protect
// "spice" from hitting "spic", "shiitake" from "shit", etc.
const WORD_TERMS = [
  // racial / homophobic / ableist slurs that share substrings with English
  "nigger",
  "niggers",
  "spic",
  "spics",
  "chink",
  "chinks",
  "retard",
  "retards",
  "retarded",
  "dyke",
  "dykes",
  "cunt",
  "cunts",
  // sexual / vulgar
  "fuck",
  "fucks",
  "fucked",
  "fucking",
  "fucker",
  "fuckers",
  "fck",
  "fcks",
  "fuk",
  "fuks",
  "fukk",
  "fak",
  "faks",
  "phuck",
  "shit",
  "shits",
  "shitty",
  "shyt",
  "bitch",
  "bitches",
  "bitchy",
  "bitchin",
  "twat",
  "twats",
  "whore",
  "whores",
  "slut",
  "sluts",
  "pussy",
  "wank",
  "wanker",
  "wankers",
  "douche",
  "douchebag",
  "bastard",
  "bastards",
  "bollocks",
  // Explicit sexual / off-topic terms — the chatbot should refuse, not engage,
  // and the kitchen shouldn't be reading them in special-request notes.
  // Word-boundary checks keep these from hitting "Dickens", "cocktail",
  // "peacock", "shoehorn", etc.
  "dick",
  "dicks",
  "cock",
  "cocks",
  "penis",
  "vagina",
  "blowjob",
  "blowjobs",
  "handjob",
  "handjobs",
  "horny",
  "porn",
  "porno",
  "boner",
  "boners",
  "motherfucker",
  "motherfuckers",
  "asshole",
  "assholes",
];

// Terms checked as substrings against the dense form. Reserved for slurs
// long/specific enough that a substring match is virtually never accidental,
// so they catch obfuscations like "n.i.g.g.a", "n_i_g_g_a", "n!gga", and
// stretched forms like "fuuuck" (collapsed to "fuck" by denseNormalise).
const DENSE_TERMS = [
  "nigga",
  "niggas",
  "nigger",
  "niggers",
  "faggot",
  "faggots",
  "fagot",
  "fagots",
  "tranny",
  "trannies",
  "kike",
  "kikes",
  "gook",
  "gooks",
  "wetback",
  "wetbacks",
  "biatch",
  "biatches",
  "motherfucker",
  "motherfuckers",
  "motherfucking",
  "cocksucker",
  "cocksuckers",
  "dickhead",
  "dickheads",
  "asshole",
  "assholes",
  "phuck",
  // F-word — no legitimate English word contains "fuck" as a substring,
  // so adding it here catches stretched ("fuuuck"), spaced ("F U C K"),
  // and dotted ("f.u.c.k") forms that slip past the word-boundary check.
  "fuck",
  "fucks",
  "fucked",
  "fucking",
  "fucker",
  "fuckers",
];

const CHINESE_OFFENSIVE = [
  "操你",
  "操你妈",
  "操你媽",
  "傻逼",
  "傻屄",
  "草泥马",
  "草泥馬",
  "干你娘",
  "幹你娘",
  "他妈的",
  "他媽的",
  "贱人",
  "賤人",
];

const wordRegex = new RegExp(`\\b(?:${WORD_TERMS.join("|")})\\b`);

export function containsOffensiveLanguage(input: string): boolean {
  if (!input) return false;

  const light = lightNormalise(input);
  if (wordRegex.test(light)) return true;

  const dense = denseNormalise(input);
  if (DENSE_TERMS.some((term) => dense.includes(term))) return true;

  const lowered = input.toLowerCase();
  if (CHINESE_OFFENSIVE.some((term) => lowered.includes(term))) return true;

  return false;
}
