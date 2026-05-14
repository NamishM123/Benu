import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// BCP 47 codes we accept as `target`. Mirrors the Lang union in
// lib/i18n.ts — when adding a new locale there, add it here too.
const SUPPORTED_TARGETS = new Set([
  "en",
  "es",
  "zh-Hans",
  "zh-Hant",
  "tl",
  "vi",
  "ko",
  "ja",
  "fa",
  "hy",
  "ru",
]);

type Body = { texts?: string[]; target?: string };

// Per-language hint that goes into the prompt. We keep this short — the
// model already knows the language; the hint is mainly to nudge register
// (menu-appropriate, neutral, Latin-American Spanish vs. Castilian, etc.)
// and script (Traditional vs Simplified Chinese, native script for ko/
// ja/fa/hy/ru).
const TARGET_DESCRIPTIONS: Record<string, string> = {
  en: "natural English suitable for a restaurant menu",
  es: "neutral Latin American Spanish suitable for a casual restaurant menu",
  "zh-Hans":
    "Simplified Chinese (Mandarin) suitable for a Chinese restaurant menu in North America",
  "zh-Hant":
    "Traditional Chinese (suitable for Cantonese-speaking diners) in Traditional characters",
  tl: "natural Filipino/Tagalog suitable for a casual restaurant menu — keep English food terms (e.g. 'cart', 'noodles') when they are conventional",
  vi: "natural Vietnamese with proper tone marks, suitable for a casual restaurant menu",
  ko: "natural Korean using Hangul, suitable for a casual restaurant menu, polite -요/-습니다 register",
  ja: "natural Japanese using a mix of kanji/hiragana/katakana as appropriate, polite ます/です register, suitable for a restaurant menu",
  fa: "natural Persian (Farsi) in the Persian script, suitable for a casual restaurant menu. Flag pork dishes explicitly (گوشت خوک) since the audience is largely Muslim",
  hy: "natural Eastern Armenian in the Armenian script, suitable for a casual restaurant menu",
  ru: "natural Russian in Cyrillic, suitable for a casual restaurant menu",
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ translations: {} }, { status: 400 });
  }

  const texts = (body.texts ?? []).filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0,
  );
  const target =
    typeof body.target === "string" && SUPPORTED_TARGETS.has(body.target)
      ? body.target
      : "zh-Hans";

  if (texts.length === 0) {
    return NextResponse.json({ translations: {} });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ translations: {} });
  }

  // Hard-cap input size for safety
  if (texts.length > 60) texts.length = 60;

  const client = new Anthropic({ apiKey });

  const targetLang = TARGET_DESCRIPTIONS[target] ?? TARGET_DESCRIPTIONS["en"];

  const userPrompt = `Translate the following English restaurant menu strings (dish names, descriptions, etc.) to ${targetLang}.

Rules:
- Translate naturally and concisely. Keep parenthetical notes like "(8 pc)" intact when present.
- Keep numbers, prices, and brand names (Coke, Sprite, Sichuan, Taiwanese) recognizable.
- For dish names from Chinese cuisine without a direct equivalent, keep a recognizable romanization or native script and add a short descriptive translation.
- Output ONLY a JSON object whose keys are the EXACT original English strings I gave you and whose values are the translations. No explanations, no extra fields.

Texts to translate:
${JSON.stringify(texts)}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system:
        "You are a precise translation engine for restaurant menus. Output valid JSON only.",
      messages: [{ role: "user", content: userPrompt }],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            additionalProperties: { type: "string" },
          },
        },
      },
    });

    let raw: string | null = null;
    for (const block of response.content) {
      if (block.type === "text") {
        raw = block.text;
        break;
      }
    }
    if (!raw) {
      return NextResponse.json({ translations: {} });
    }

    let map: Record<string, unknown>;
    try {
      map = JSON.parse(raw);
    } catch {
      return NextResponse.json({ translations: {} });
    }

    const cleaned: Record<string, string> = {};
    for (const original of texts) {
      const v = map[original];
      if (typeof v === "string" && v.trim().length > 0) {
        cleaned[original] = v.trim();
      }
    }
    return NextResponse.json({ translations: cleaned });
  } catch (e) {
    return NextResponse.json(
      { translations: {}, error: (e as Error).message },
      { status: 500 },
    );
  }
}
