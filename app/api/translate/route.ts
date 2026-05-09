import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = { texts?: string[]; target?: "zh" | "en" };

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
  const target = body.target === "en" ? "en" : "zh";

  if (texts.length === 0) {
    return NextResponse.json({ translations: {} });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ translations: {} });
  }

  // Hard-cap input size for safety
  if (texts.length > 60) texts.length = 60;

  const openai = new OpenAI({ apiKey });

  const targetLang =
    target === "zh"
      ? "Simplified Chinese (Mandarin), suitable for a Chinese restaurant menu in North America"
      : "natural English suitable for a restaurant menu";

  const userPrompt = `Translate the following English restaurant menu strings (dish names, descriptions, etc.) to ${targetLang}.

Rules:
- Translate naturally and concisely. Keep parenthetical notes like "(8 pc)" intact when present.
- Keep numbers, prices, and brand names (Coke, Sprite, Sichuan, Taiwanese) recognizable.
- Output ONLY a JSON object whose keys are the EXACT original English strings I gave you and whose values are the translations. No explanations, no extra fields.

Texts to translate:
${JSON.stringify(texts)}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a precise translation engine for restaurant menus. Output valid JSON only.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
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
