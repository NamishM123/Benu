import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifyCookieValue } from "@/lib/staff-auth";

// Customer-facing HTML routes. On the staff host these are redirected to
// the customer host so staff can't accidentally land on them.
function isCustomerPage(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/menu" ||
    pathname === "/orders" ||
    pathname.startsWith("/order/")
  );
}

// Staff HTML routes. On the customer host these redirect to the staff host
// so QR-scanning customers can't reach the kitchen UI by URL.
function isStaffPage(pathname: string): boolean {
  return (
    pathname === "/kitchen" ||
    pathname === "/staff/login" ||
    pathname.startsWith("/admin/")
  );
}

// Public endpoints customers need:
//   GET  /api/orders?clientId=...    (their own orders)
//   POST /api/orders                  (place a new order)
//   GET  /api/menu/items[/<id>]       (read the menu)
// Everything else under /kitchen, /admin/*, /api/orders, or /api/menu is
// staff-only.
function needsStaffAuth(
  pathname: string,
  method: string,
  hasClientId: boolean,
): boolean {
  if (pathname === "/kitchen") return true;
  if (pathname.startsWith("/admin/")) return true;
  if (pathname === "/api/orders") {
    if (method === "POST") return false;
    if (method === "GET" && hasClientId) return false;
    return true;
  }
  if (pathname.startsWith("/api/orders/")) {
    return true;
  }
  if (
    pathname === "/api/menu/items" ||
    pathname.startsWith("/api/menu/items/")
  ) {
    return method !== "GET";
  }
  return false;
}

function redirectToHost(
  req: NextRequest,
  targetHost: string,
  pathname: string,
): NextResponse {
  const target = new URL(req.nextUrl.toString());
  target.host = targetHost;
  target.protocol = "https:";
  target.port = "";
  target.pathname = pathname;
  return NextResponse.redirect(target);
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const method = req.method;
  const hasClientId = searchParams.has("clientId");

  const host = (req.headers.get("host") || "").trim().toLowerCase();
  // Trim/lowercase env values defensively: pasting a hostname into the
  // Vercel UI is easy to accidentally do with a trailing space.
  const staffHost = process.env.STAFF_HOST?.trim().toLowerCase();
  const customerHost = process.env.CUSTOMER_HOST?.trim().toLowerCase();
  const onStaffHost = !!staffHost && host === staffHost;
  const onCustomerHost = !!customerHost && host === customerHost;

  // ---- host-based redirects (HTML pages only) ---------------------------
  if (!pathname.startsWith("/api/")) {
    if (onStaffHost && isCustomerPage(pathname)) {
      // Land staff at the kitchen instead of /menu when they hit "/".
      if (pathname === "/") {
        const dest = req.nextUrl.clone();
        dest.pathname = "/kitchen";
        return NextResponse.redirect(dest);
      }
      if (customerHost) {
        return redirectToHost(req, customerHost, pathname);
      }
    }
    if (onCustomerHost && isStaffPage(pathname) && staffHost) {
      return redirectToHost(req, staffHost, pathname);
    }
  }

  // ---- auth check on protected routes ----------------------------------
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
    "/",
    "/menu",
    "/orders",
    "/order/:path*",
    "/kitchen",
    "/admin/:path*",
    "/staff/login",
    "/api/orders",
    "/api/orders/:path*",
    "/api/menu/items",
    "/api/menu/items/:path*",
  ],
};
