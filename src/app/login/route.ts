import { NextResponse, type NextRequest } from "next/server";
import { loginUrl } from "limperiam-auth-client";

/**
 * `/login?next=/t/some-list` → limperiam-auth's sign-in page, coming back
 * here afterwards.
 *
 * A server route rather than building the URL in the browser: `loginUrl()`
 * needs AUTH_PUBLIC_URL, which only exists server-side.
 *
 * The return address is built from the `Host` header, never from
 * `request.url`: inside the container the standalone server listens on
 * `0.0.0.0:3000`, and an address derived from the request URL can point
 * there instead of the public domain — limperiam-auth would then refuse it
 * and drop the person on the dashboard. Always https: Traefik terminates TLS
 * and the session cookie is `Secure`.
 */
export function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "tierlistrr.limperiam.com";
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  // Local paths only. `//evil.example` is protocol-relative and would leave
  // the site; limperiam-auth re-checks the domain anyway, this just keeps a
  // crafted link from even trying.
  const path = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(loginUrl(`https://${host}${path}`));
}
