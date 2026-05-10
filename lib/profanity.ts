/**
 * Shared profanity / slur guard. Used by:
 *   - ChatWidget — gate user messages to the bot
 *   - ItemDetailSheet — gate special-request text the kitchen will read
 *
 * English terms are matched against a normalised form (lowercased + non-letters
 * stripped), so common obfuscations like "n!gga" or "n.i.g.g.a" still match.
 * Chinese terms are matched against the lowercased raw input since CJK chars
 * are stripped by the English normalisation.
 *
 * Lists stay short and explicit on purpose — broad profanity lists cause
 * false positives (e.g. "ass" inside "passion"). Add only when needed.
 */

const ENGLISH_OFFENSIVE = [
  "nigga",
  "nigger",
  "faggot",
  "tranny",
  "retard",
  "kike",
  "spic",
  "chink",
  "gook",
  "dyke",
  "wetback",
  "cunt",
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

export function containsOffensiveLanguage(input: string): boolean {
  const lowered = input.toLowerCase();
  const normalised = lowered.replace(/[^a-z]/g, "");
  if (ENGLISH_OFFENSIVE.some((term) => normalised.includes(term))) return true;
  if (CHINESE_OFFENSIVE.some((term) => lowered.includes(term))) return true;
  return false;
}
