import OpenAI from "openai";
import { NextResponse } from "next/server";
import { answerMenuQuestion } from "@/lib/chatbot";
import { findFlaggedPreferences } from "@/lib/preferences";
import { searchPhoto } from "@/lib/unsplash";
import { listMenuItems } from "@/lib/server-menu";
import type { MenuItem } from "@/lib/menu";

export const runtime = "nodejs";

function buildSystemPrompt(menu: MenuItem[]): string {
  return `You are the friendly menu assistant for Benu, a modern noodle restaurant. Your job is to help guests pick dishes, explain flavors, and flag allergens.

Guidelines:
- Only recommend dishes from the MENU below. Never invent dishes, prices, or ingredients.
- Keep replies short and warm — 1 to 3 sentences of text.
- When the guest has selected dietary preferences (allergens or things to avoid), prefer dishes that do NOT contain them. If a relevant dish does contain them, mention which preference it conflicts with.
- When recommending or naming dishes, return their exact names in the "dish_names" array so the UI can render rich cards. Pick at most 6.
- If the guest asks something the menu can't answer, say so briefly and steer them back to the menu.

MENU (JSON):
${JSON.stringify(menu, null, 2)}`;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    text: {
      type: "string",
      description: "Friendly, concise reply to the guest (1-3 sentences).",
    },
    dish_names: {
      type: "array",
      description:
        "Exact names of dishes from the menu to surface as cards. Empty array if none apply.",
      items: { type: "string" },
    },
  },
  required: ["text", "dish_names"],
  additionalProperties: false,
} as const;

type ChatPayload = {
  question?: unknown;
  preferences?: unknown;
};

function localFallback(question: string, preferences: string[]) {
  const reply = answerMenuQuestion(question, preferences);
  return {
    text: reply.text,
    dishes: reply.dishes ?? [],
  };
}

export async function POST(req: Request) {
  let body: ChatPayload;
  try {
    body = (await req.json()) as ChatPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question : "";
  const preferences = Array.isArray(body.preferences)
    ? body.preferences.filter((p): p is string => typeof p === "string")
    : [];

  if (!question.trim()) {
    return NextResponse.json({ text: "", dishes: [] });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const menu = await listMenuItems();
  if (!apiKey) {
    return NextResponse.json(localFallback(question, preferences));
  }

  try {
    const client = new OpenAI({ apiKey });

    const userContext =
      preferences.length > 0
        ? `Selected dietary preferences to avoid: ${preferences.join(", ")}.`
        : "No dietary preferences selected.";

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        { role: "system", content: buildSystemPrompt(menu) },
        {
          role: "user",
          content: `${userContext}\n\nGuest question: ${question}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "menu_reply",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      return NextResponse.json(localFallback(question, preferences));
    }

    const parsed = JSON.parse(text) as {
      text: string;
      dish_names: string[];
    };

    const dishMap = new Map<string, MenuItem>(
      menu.map((m) => [m.name.toLowerCase(), m]),
    );
    const dishes: MenuItem[] = parsed.dish_names
      .map((name) => dishMap.get(name.toLowerCase()))
      .filter((d): d is MenuItem => Boolean(d));

    const enrichedDishes = await Promise.all(
      dishes.map(async (d) => ({
        ...d,
        image: await searchPhoto(`${d.name} dish`, d.image),
        flaggedPreferences: findFlaggedPreferences(d, preferences),
      })),
    );

    return NextResponse.json({
      text: parsed.text,
      dishes: enrichedDishes,
    });
  } catch (error) {
    console.error("chat api error:", error);
    return NextResponse.json(localFallback(question, preferences));
  }
}
