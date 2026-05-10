import { NextResponse } from "next/server";
import {
  deleteMenuItem,
  getMenuItem,
  updateMenuItem,
} from "@/lib/server-menu";
import { MENU_CATEGORIES } from "@/lib/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const item = await getMenuItem(id);
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  if ("category" in b) {
    if (
      typeof b.category !== "string" ||
      !(MENU_CATEGORIES as readonly string[]).includes(b.category)
    ) {
      return NextResponse.json(
        { error: `category must be one of: ${MENU_CATEGORIES.join(", ")}` },
        { status: 400 },
      );
    }
  }
  if ("price" in b) {
    if (
      typeof b.price !== "number" ||
      !Number.isFinite(b.price) ||
      b.price < 0
    ) {
      return NextResponse.json(
        { error: "price must be a non-negative number" },
        { status: 400 },
      );
    }
  }
  if ("spiceLevel" in b) {
    const sl = b.spiceLevel;
    if (typeof sl !== "number" || sl < 0 || sl > 3) {
      return NextResponse.json(
        { error: "spiceLevel must be 0..3" },
        { status: 400 },
      );
    }
  }

  try {
    const item = await updateMenuItem(id, b);
    if (!item)
      return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "updateMenuItem failed", message },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ok = await deleteMenuItem(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
