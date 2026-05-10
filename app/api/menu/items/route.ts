import { NextResponse } from "next/server";
import { createMenuItem, listMenuItems } from "@/lib/server-menu";
import { MENU_CATEGORIES } from "@/lib/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await listMenuItems();
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "listMenu failed", message },
      { status: 500 },
    );
  }
}

function validateBody(b: Record<string, unknown>): string | null {
  if (typeof b.name !== "string" || !b.name.trim()) return "name required";
  if (typeof b.description !== "string") return "description required";
  if (typeof b.price !== "number" || !Number.isFinite(b.price) || b.price < 0)
    return "price must be a non-negative number";
  if (
    typeof b.category !== "string" ||
    !(MENU_CATEGORIES as readonly string[]).includes(b.category)
  )
    return `category must be one of: ${MENU_CATEGORIES.join(", ")}`;
  const sl = b.spiceLevel;
  if (typeof sl !== "number" || sl < 0 || sl > 3)
    return "spiceLevel must be 0..3";
  return null;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const err = validateBody(b);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    const item = await createMenuItem({
      name: b.name as string,
      nameZh: typeof b.nameZh === "string" ? b.nameZh : undefined,
      description: b.description as string,
      descriptionZh:
        typeof b.descriptionZh === "string" ? b.descriptionZh : undefined,
      price: b.price as number,
      category: b.category as string,
      spiceLevel: b.spiceLevel as 0 | 1 | 2 | 3,
      tags: Array.isArray(b.tags) ? (b.tags as string[]) : [],
      image: typeof b.image === "string" ? b.image : "",
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "createMenuItem failed", message },
      { status: 500 },
    );
  }
}
