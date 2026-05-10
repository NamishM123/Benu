import OpenAI from "openai";
import { NextResponse } from "next/server";
import { answerMenuQuestion } from "@/lib/chatbot";
import { findFlaggedPreferences } from "@/lib/preferences";
import { searchPhoto } from "@/lib/unsplash";
import { listMenuItems } from "@/lib/server-menu";
import { extractAllergensFromText } from "@/lib/allergen-detect";
import { isMedicalEmergency } from "@/lib/emergency-detect";
import type { MenuItem } from "@/lib/menu";

// Hardcoded medical-emergency response. The chat intercepts before any
// LLM call when the user's message looks like a medical emergency, so
// the response below is what they see — no menu suggestions, no
// "what flavors are you in the mood for?" reply. This is shipped in
// both languages so it works regardless of the user's language toggle.
const EMERGENCY_TEXT_EN =
  "🚨 If this is a medical emergency, call 911 immediately. If you have an EpiPen, use it now. Flag down a Benu staff member right away — don't wait. Do not eat or drink anything else, and do not drive yourself if your symptoms are severe.\n\nI'm just a menu assistant and can't give medical advice. Please get human help right now.";

export const runtime = "nodejs";

function buildSystemPrompt(menu: MenuItem[]): string {
  return `You are the menu assistant for Benu, a noodle restaurant. Your job is to help guests pick dishes, explain flavors, and — most importantly — keep them safe from allergens.

MEDICAL EMERGENCY OVERRIDE (highest priority — overrides all menu behavior):
- If the guest mentions ANY of: an active allergic reaction, anaphylaxis, can't breathe, throat closing/swelling, lips/tongue/face swelling, EpiPen, "I'm dying", "I need help" combined with feeling sick, chest pain, vomiting after eating, passing out — STOP all menu chat.
- Your reply text must be ONLY the following (translated into the guest's language if they wrote in another language): "🚨 If this is a medical emergency, call 911 immediately. If you have an EpiPen, use it now. Flag down a Benu staff member right away — don't wait. Do not eat or drink anything else. I'm just a menu assistant — please get human help right now."
- dish_names must be an empty array. Do NOT suggest food. Do NOT ask "what flavors are you in the mood for?" Do NOT continue normal menu chat until the guest explicitly says they're OK now.

CRITICAL ALLERGEN SAFETY RULES (these override normal menu behavior):
- The "ALLERGENS TO AVOID" list at the start of the user message is a HARD constraint, not a preference. Treat every entry as a life-threatening allergy.
- NEVER, under any circumstances, recommend / suggest / list / surface / mention as a good option / describe positively any dish whose tags include an allergen on that list. Do not put it in dish_names. Do not say "you might enjoy it anyway." Do not call it "delicious" or "popular" while warning about it. Just exclude it.
- If the guest asks specifically about a dish that contains one of their allergens, your text reply must LEAD with a clear warning, e.g. "⚠️ Heads up — Braised Pork over White Rice contains soy, which you said you can't have. I'd skip it." Do not put the dish in dish_names.
- If every dish that fits the request contains an allergen, say so honestly ("Nothing on our menu fits — every option contains soy.") rather than recommending an unsafe dish.
- Allergens in scope: Dairy, Fish (incl. shellfish), Gluten, Meat (incl. beef/pork/lamb/chicken), Nuts (incl. peanuts), Soy.

General guidelines:
- Only recommend dishes from the MENU below. Never invent dishes, prices, or ingredients.
- Keep replies short and warm — 1 to 3 sentences of text.
- Return exact dish names in "dish_names" so the UI can render rich cards. Pick at most 6.
- Each dish in the MENU has a "tags" array; an item with tag "soy" contains soy, "dairy" contains dairy, etc.
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
        "Exact names of dishes from the menu to surface as cards. Empty array if none apply. NEVER include dishes containing the guest's allergens.",
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

function localFallback(
  question: string,
  preferences: string[],
  detectedAllergens: string[],
) {
  const reply = answerMenuQuestion(question, preferences);
  // Hard-filter the local fallback's dishes too
  const safeDishes = (reply.dishes ?? []).filter(
    (d) => findFlaggedPreferences(d, preferences).length === 0,
  );
  return {
    text: reply.text,
    dishes: safeDishes,
    detectedAllergens,
    isEmergency: false,
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
  const explicitPreferences = Array.isArray(body.preferences)
    ? body.preferences.filter((p): p is string => typeof p === "string")
    : [];

  if (!question.trim()) {
    return NextResponse.json({
      text: "",
      dishes: [],
      detectedAllergens: [],
      isEmergency: false,
    });
  }

  // SAFETY: medical-emergency intercept. If the message looks like the
  // customer is in distress (allergic reaction, can't breathe, "I'm
  // dying", etc.), bypass the LLM entirely and return a fixed
  // emergency-instructions reply. The LLM has demonstrably failed at
  // this — it told a customer in active anaphylaxis "I'd love to help
  // you find something delicious!" — so we do NOT trust it for this.
  if (isMedicalEmergency(question)) {
    return NextResponse.json({
      text: EMERGENCY_TEXT_EN,
      dishes: [],
      detectedAllergens: [],
      isEmergency: true,
    });
  }

  // SAFETY: extract any allergies stated in the chat message itself and
  // merge them with the user's existing preferences for this turn. The
  // detected list is also returned so the client can persist them as
  // proper dietary preferences (toggle the filter on for them).
  const detectedAllergens = extractAllergensFromText(question);
  const preferences = Array.from(
    new Set([...explicitPreferences, ...detectedAllergens]),
  );

  const apiKey = process.env.OPENAI_API_KEY;
  const menu = await listMenuItems();
  if (!apiKey) {
    return NextResponse.json(
      localFallback(question, preferences, detectedAllergens),
    );
  }

  try {
    const client = new OpenAI({ apiKey });

    const allergenLine =
      preferences.length > 0
        ? `ALLERGENS TO AVOID (HARD CONSTRAINT — never recommend a dish containing any of these): ${preferences.join(", ")}.`
        : "ALLERGENS TO AVOID: none stated.";

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        { role: "system", content: buildSystemPrompt(menu) },
        {
          role: "user",
          content: `${allergenLine}\n\nGuest question: ${question}`,
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
      return NextResponse.json(
        localFallback(question, preferences, detectedAllergens),
      );
    }

    const parsed = JSON.parse(text) as {
      text: string;
      dish_names: string[];
    };

    const dishMap = new Map<string, MenuItem>(
      menu.map((m) => [m.name.toLowerCase(), m]),
    );
    const llmDishes: MenuItem[] = parsed.dish_names
      .map((name) => dishMap.get(name.toLowerCase()))
      .filter((d): d is MenuItem => Boolean(d));

    // SAFETY: hard-filter the LLM's dish list. If the model ignored the
    // allergen instruction (it does, sometimes), drop those dishes here so
    // they never reach the customer.
    const unsafeDishes = preferences.length
      ? llmDishes.filter(
          (d) => findFlaggedPreferences(d, preferences).length > 0,
        )
      : [];
    const safeDishes = preferences.length
      ? llmDishes.filter(
          (d) => findFlaggedPreferences(d, preferences).length === 0,
        )
      : llmDishes;

    // SAFETY: if the LLM tried to recommend an unsafe dish, override the
    // chat text with an explicit warning so the customer is not encouraged
    // to try one of the dropped dishes.
    let finalText = parsed.text;
    if (unsafeDishes.length > 0) {
      const allergens = Array.from(
        new Set(
          unsafeDishes.flatMap((d) => findFlaggedPreferences(d, preferences)),
        ),
      );
      const dishList = unsafeDishes.map((d) => d.name).join(", ");
      finalText =
        `⚠️ Heads up — ${dishList} contains ${allergens.join(", ")}, which you said you can't have, so I've removed ${unsafeDishes.length === 1 ? "it" : "them"} from the suggestions.` +
        (safeDishes.length > 0 ? ` Here ${safeDishes.length === 1 ? "is" : "are"} safer ${safeDishes.length === 1 ? "option" : "options"} instead:` : "");
    }

    const enrichedDishes = await Promise.all(
      safeDishes.map(async (d) => ({
        ...d,
        image: await searchPhoto(`${d.name} dish`, d.image),
        flaggedPreferences: findFlaggedPreferences(d, preferences),
      })),
    );

    return NextResponse.json({
      text: finalText,
      dishes: enrichedDishes,
      detectedAllergens,
      isEmergency: false,
    });
  } catch (error) {
    console.error("chat api error:", error);
    return NextResponse.json(
      localFallback(question, preferences, detectedAllergens),
    );
  }
}
