import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifyCookieValue } from "@/lib/staff-auth";

// Public endpoints customers need:
//   GET  /api/orders?clientId=...    (their own orders)
//   POST /api/orders                  (place a new order)
//   GET  /api/menu/items[/<id>]       (read the menu)
// Everything else under /kitchen, /admin/*, /api/orders, or /api/menu is
// staff-only.
function needsStaffAuth(pathname: string, method: string, hasClientId: boolean): boolean {
  if (pathname === "/kitchen") return true;
  if (pathname.startsWith("/admin/")) return true;
  if (pathname === "/api/orders") {
    if (method === "POST") return false;
    if (method === "GET" && hasClientId) return false;
    return true;
  }
  if (pathname.startsWith("/api/orders/")) {
    // GET/PATCH/DELETE on a specific order — kitchen-only
    return true;
  }
  if (pathname === "/api/menu/items" || pathname.startsWith("/api/menu/items/")) {
    // GET is public (customers + chat). Mutations are staff-only.
    return method !== "GET";
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const method = req.method;
  const hasClientId = searchParams.has("clientId");

  if (!needsStaffAuth(pathname, method, hasClientId)) {
    return NextResponse.next();
  }

  const secret = process.env.STAFF_COOKIE_SECRET;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const ok = secret ? await verifyCookieValue(cookie, secret) : false;
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/staff/login";
  url.search = "";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/kitchen",
    "/admin/:path*",
    "/api/orders",
    "/api/orders/:path*",
    "/api/menu/items",
    "/api/menu/items/:path*",
  ],
};
