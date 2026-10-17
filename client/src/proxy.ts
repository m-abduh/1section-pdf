import { NextResponse, type NextRequest } from "next/server";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "1section.com")
  .split(":")[0]
  .toLowerCase();

const DEV_SUFFIXES = ["localhost", "lvh.me"];

const RESERVED_PREFIXES = ["/checkout", "/admin", "/api", "/_next"];

function isReserved(pathname: string): boolean {
  return RESERVED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return null;

  const suffixes = new Set([ROOT_DOMAIN, ...DEV_SUFFIXES]);

  for (const suffix of suffixes) {
    if (host === suffix) return null;
    if (host.endsWith(`.${suffix}`)) {
      const sub = host.slice(0, -(suffix.length + 1));
      if (!sub || sub.includes(".")) return null;
      return sub;
    }
  }

  return null;
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);
  const { pathname } = request.nextUrl;

  if (subdomain === "admin") {
    if (pathname.startsWith("/admin")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if (subdomain && subdomain !== "www") {
    if (pathname.startsWith("/niche/") || isReserved(pathname)) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = `/niche/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
