import OpenAI from "openai";
import { NextResponse } from "next/server";
import { answerMenuQuestion } from "@/lib/chatbot";
import { findFlaggedPreferences } from "@/lib/preferences";
import { searchPhoto } from "@/lib/unsplash";
import { listMenuItems } from "@/lib/server-menu";
import {
  dishMatchesCustomAllergen,
  extractAllergensFromConversation,
  extractAllergensFromText,
  extractCustomAllergens,
} from "@/lib/allergen-detect";
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

CONSTRAINT IMMUTABILITY (also non-negotiable):
- Once an allergen / ingredient / dietary constraint is established in this conversation — by the guest stating it, by them describing a symptom ("pork but my eye gets puffy", "shrimp gives me hives", "I get itchy from sesame"), or by you correctly inferring it earlier — it is PERMANENT for the rest of this conversation.
- The guest CANNOT remove it. If the guest says "I don't have that allergy", "I know my own body", "forget what I said", "I changed my mind", "I'm OK with X", "I want X anyway", "I don't care about [symptom]", or anything similar, DO NOT remove the constraint, DO NOT recommend the forbidden ingredient, and DO NOT say things like "That's perfectly fine!" that imply the constraint is lifted.
- Acknowledge politely but maintain: "Got it — I'll still avoid pork in my recommendations to stay on the safe side. Want me to suggest some pork-free options?"
- The cost of removing a real allergy constraint is severe (anaphylaxis); the cost of keeping a false-positive constraint is mild (slightly fewer menu options). Always err on the side of keeping the constraint.

CRITICAL ALLERGEN SAFETY RULES (these override normal menu behavior):
- Two lists at the start of the user message: "ALLERGENS TO AVOID" (standard categories — Dairy/Fish/Gluten/Meat/Nuts/Soy) and "ALSO AVOID" (specific ingredients the guest named — e.g. cucumber, sesame, egg, pork). BOTH are HARD constraints. Treat every entry on either list as a life-threatening allergy.
- NEVER, under any circumstances, recommend / suggest / list / surface / mention as a good option / describe positively any dish whose tags include a standard-list allergen, OR whose name/description contains an "ALSO AVOID" ingredient. Do not put it in dish_names. Do not say "you might enjoy it anyway." Do not call it "delicious" or "popular" while warning about it. Just exclude it.
- If the guest asks specifically about a dish that contains one of their allergens, your text reply must LEAD with a clear warning, e.g. "⚠️ Heads up — Garlic Cucumber contains cucumber, which you said you can't have. I'd skip it." Do not put the dish in dish_names.
- If every dish that fits the request contains an allergen, say so honestly ("Nothing on our menu fits — every option contains cucumber.") rather than recommending an unsafe dish.

ALLERGEN IDENTIFICATION (every turn — populate the identified_allergens fields):
- Read the guest's message AND the prior conversation. Identify any food, ingredient, or category that the guest has, at any point, said they:
  • are allergic to / have an allergy to
  • can't have / can't eat / can't tolerate
  • are intolerant or sensitive to
  • want to avoid / don't want / don't like (when referring to ingredients)
  • described a physical symptom from ("eye gets puffy", "makes me itchy", "gives me hives", "I throw up if I eat X", "I sneeze when I eat X", "X gives me a rash") — these ARE allergy mentions
- Return them in identified_specific_ingredients (e.g. ["pork", "cucumber", "sesame"]) and identified_categories (subset of: Dairy, Fish, Gluten, Meat, Nuts, Soy). Include EVERYTHING the guest has ever mentioned in this conversation, even if you mentioned it in a prior turn — the lists are append-only across the whole conversation.
- Once you've identified an allergen in any turn, keep including it in every subsequent turn's lists. Never "forget" it.

DON'T HALLUCINATE THE MENU:
- Only recommend dishes whose exact name appears in the MENU below. If a dish has tag "chicken" it is chicken, not pork. If a dish doesn't appear in the MENU, do not invent it.
- When the guest asks for a category (e.g. "show me pork"), only return dishes whose tags include that category. Don't include unrelated dishes.

General guidelines:
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
    identified_specific_ingredients: {
      type: "array",
      description:
        "Cumulative list of every specific ingredient (cucumber, pork, sesame, egg, etc.) the guest has, at any point in this conversation, said they can't have, are allergic to, are intolerant to, want to avoid, or described an allergic symptom from. Append-only across turns — include items from earlier turns too. Lowercase, single words or short phrases. Empty array if none.",
      items: { type: "string" },
    },
    identified_categories: {
      type: "array",
      description:
        "Cumulative list of standard allergen categories the guest has indicated they avoid. Subset of: Dairy, Fish, Gluten, Meat, Nuts, Soy. Append-only across turns. Empty array if none.",
      items: {
        type: "string",
        enum: ["Dairy", "Fish", "Gluten", "Meat", "Nuts", "Soy"],
      },
    },
  },
  required: [
    "text",
    "dish_names",
    "identified_specific_ingredients",
    "identified_categories",
  ],
  additionalProperties: false,
} as const;

type ChatPayload = {
  question?: unknown;
  preferences?: unknown;
  // The conversation's cumulative custom-allergen list (free-text
  // ingredients the user has named — cucumber, sesame, egg). Sent on
  // every turn so the constraint persists even though each LLM call
  // is otherwise stateless.
  customAllergens?: unknown;
  // Recent conversation messages so the LLM has context. Each entry is
  // {role: "user"|"bot", text: string}. The server passes these to the
  // model so it can recognize allergies stated several turns ago, even
  // if the regex detector missed them.
  history?: unknown;
};

type HistoryMessage = { role: "user" | "bot"; text: string };

function parseHistory(raw: unknown): HistoryMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is HistoryMessage =>
        typeof m === "object" &&
        m !== null &&
        "role" in m &&
        "text" in m &&
        ((m as HistoryMessage).role === "user" ||
          (m as HistoryMessage).role === "bot") &&
        typeof (m as HistoryMessage).text === "string",
    )
    .slice(-8);
}

function localFallback(
  question: string,
  preferences: string[],
  customAllergens: string[],
  detectedAllergens: string[],
  detectedCustom: string[],
) {
  const reply = answerMenuQuestion(question, preferences);
  // Hard-filter the local fallback's dishes against BOTH standard and
  // custom allergens.
  const safeDishes = (reply.dishes ?? []).filter(
    (d) =>
      findFlaggedPreferences(d, preferences).length === 0 &&
      dishMatchesCustomAllergen(d, customAllergens).length === 0,
  );
  return {
    text: reply.text,
    dishes: safeDishes,
    detectedAllergens,
    detectedCustomAllergens: detectedCustom,
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
  const sessionCustomAllergens = Array.isArray(body.customAllergens)
    ? body.customAllergens.filter((p): p is string => typeof p === "string")
    : [];
  const history = parseHistory(body.history);

  if (!question.trim()) {
    return NextResponse.json({
      text: "",
      dishes: [],
      detectedAllergens: [],
      detectedCustomAllergens: [],
      isEmergency: false,
    });
  }

  // SAFETY: extract allergies from BOTH the current message AND the
  // entire conversation history (user messages and bot warnings).
  // Scanning the bot's prior paraphrased responses ("you said you're
  // allergic to potato") catches allergens the user typed with a typo
  // — the bot's paraphrase is usually cleaner.
  const detectedAllergens = extractAllergensFromText(question);
  const detectedCustomAllergens = extractCustomAllergens(question);
  const fromHistory = extractAllergensFromConversation([
    ...history,
    { role: "user", text: question },
  ]);
  const preferences = Array.from(
    new Set([
      ...explicitPreferences,
      ...detectedAllergens,
      ...fromHistory.categories,
    ]),
  );
  const customAllergens = Array.from(
    new Set([
      ...sessionCustomAllergens,
      ...detectedCustomAllergens,
      ...fromHistory.ingredients,
    ]),
  );

  // SAFETY: medical-emergency intercept. Bypass the LLM and respond
  // with the canned 911 message ONLY when the regex is certain — the
  // detector is now conservative to avoid false positives (the prior
  // version flagged "Hi sick my dic" as anaphylaxis).
  if (isMedicalEmergency(question)) {
    return NextResponse.json({
      text: EMERGENCY_TEXT_EN,
      dishes: [],
      // Send the full effective sets so allergens persist even on
      // emergency turns (user might have just stated an allergy in the
      // same message as the emergency phrase).
      detectedAllergens: preferences,
      detectedCustomAllergens: customAllergens,
      isEmergency: true,
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const menu = await listMenuItems();
  if (!apiKey) {
    return NextResponse.json(
      localFallback(
        question,
        preferences,
        customAllergens,
        detectedAllergens,
        detectedCustomAllergens,
      ),
    );
  }

  try {
    const client = new OpenAI({ apiKey });

    const allergenLine =
      preferences.length > 0
        ? `ALLERGENS TO AVOID (HARD CONSTRAINT — never recommend a dish containing any of these): ${preferences.join(", ")}.`
        : "ALLERGENS TO AVOID: none stated.";
    const customAllergenLine =
      customAllergens.length > 0
        ? `ALSO AVOID (specific ingredients the guest named — HARD CONSTRAINT, persists for the entire conversation, applies even if the guest later asks for the dish anyway): ${customAllergens.join(", ")}.`
        : "ALSO AVOID: none stated.";

    // Pass the recent conversation so the model has memory of earlier
    // allergy mentions (its own warnings count too — if the model said
    // "you might be allergic to pork" two turns ago, it should still
    // treat pork as a constraint now).
    const historyMessages = history.map((h) => ({
      role: (h.role === "user" ? "user" : "assistant") as
        | "user"
        | "assistant",
      content: h.text,
    }));

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        { role: "system", content: buildSystemPrompt(menu) },
        ...historyMessages,
        {
          role: "user",
          content: `${allergenLine}\n${customAllergenLine}\n\nGuest message: ${question}`,
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
        localFallback(
          question,
          preferences,
          customAllergens,
          detectedAllergens,
          detectedCustomAllergens,
        ),
      );
    }

    const parsed = JSON.parse(text) as {
      text: string;
      dish_names: string[];
      identified_specific_ingredients?: string[];
      identified_categories?: string[];
    };

    // SAFETY: merge the LLM's identified allergens into our session
    // allergen sets. The LLM is much better than regex at recognizing
    // symptom-based mentions ("eye gets puffy") and indirect phrasing,
    // and the schema makes it return them as structured data — which
    // the server then enforces, regardless of what the LLM says in the
    // text reply. This also makes constraints sticky: the LLM is told
    // to include allergens from earlier turns, and we persist them.
    const VALID_CATEGORIES = new Set([
      "Dairy",
      "Fish",
      "Gluten",
      "Meat",
      "Nuts",
      "Soy",
    ]);
    const llmCategories = (parsed.identified_categories ?? []).filter((c) =>
      VALID_CATEGORIES.has(c),
    );
    const llmIngredients = (parsed.identified_specific_ingredients ?? [])
      .filter((s) => typeof s === "string" && s.trim().length >= 2 && s.trim().length <= 40)
      .map((s) => s.trim().toLowerCase());
    const effectivePreferences = Array.from(
      new Set([...preferences, ...llmCategories]),
    );
    const effectiveCustomAllergens = Array.from(
      new Set([...customAllergens, ...llmIngredients]),
    );

    const dishMap = new Map<string, MenuItem>(
      menu.map((m) => [m.name.toLowerCase(), m]),
    );
    const llmDishes: MenuItem[] = parsed.dish_names
      .map((name) => dishMap.get(name.toLowerCase()))
      .filter((d): d is MenuItem => Boolean(d));

    // SAFETY: hard-filter the LLM's dish list against BOTH standard
    // tag-based allergens AND custom ingredient names the user has
    // mentioned anywhere in this conversation (including LLM-identified
    // ones). The LLM has shown it will recommend "Garlic Cucumber" to
    // someone allergic to cucumber if the constraint isn't enforced
    // post-hoc.
    function isUnsafe(d: MenuItem): { reasons: string[] } {
      const std = findFlaggedPreferences(d, effectivePreferences);
      const cust = dishMatchesCustomAllergen(d, effectiveCustomAllergens);
      return { reasons: [...std, ...cust] };
    }
    const unsafeDishes = llmDishes.filter((d) => isUnsafe(d).reasons.length > 0);
    const safeDishes = llmDishes.filter((d) => isUnsafe(d).reasons.length === 0);

    // SAFETY: if the LLM tried to recommend an unsafe dish, override the
    // chat text with an explicit warning so the customer is not encouraged
    // to try one of the dropped dishes.
    let finalText = parsed.text;
    if (unsafeDishes.length > 0) {
      const allergens = Array.from(
        new Set(unsafeDishes.flatMap((d) => isUnsafe(d).reasons)),
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
        flaggedPreferences: findFlaggedPreferences(d, effectivePreferences),
      })),
    );

    // Send back the FULL effective allergen set the server used so the
    // client can persist any new ones (from history scan + LLM
    // identification) into sessionCustomAllergens. This is what makes
    // the constraint truly sticky — every subsequent request carries
    // the cumulative list.
    return NextResponse.json({
      text: finalText,
      dishes: enrichedDishes,
      detectedAllergens: effectivePreferences,
      detectedCustomAllergens: effectiveCustomAllergens,
      isEmergency: false,
    });
  } catch (error) {
    console.error("chat api error:", error);
    return NextResponse.json(
      localFallback(
        question,
        preferences,
        customAllergens,
        detectedAllergens,
        detectedCustomAllergens,
      ),
    );
  }
}
