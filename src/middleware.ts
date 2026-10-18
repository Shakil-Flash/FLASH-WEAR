import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Rate limit configurations by endpoint prefix
const RATE_LIMIT_RULES: Record<string, { limit: number; windowMs: number }> = {
  "/api/admin/auth": { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 mins
  "/api/checkout": { limit: 20, windowMs: 5 * 60 * 1000 },    // 20 checkouts per 5 mins
  "/api/coupons/validate": { limit: 30, windowMs: 5 * 60 * 1000 }, // 30 validations per 5 mins
  "/api/account/referrals/validate": { limit: 30, windowMs: 5 * 60 * 1000 },
  "/api/newsletter": { limit: 10, windowMs: 10 * 60 * 1000 }, // 10 signups per 10 mins
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // 1. Rate limiting for sensitive public/auth endpoints
  for (const [routePrefix, rule] of Object.entries(RATE_LIMIT_RULES)) {
    if (pathname.startsWith(routePrefix)) {
      const key = `${routePrefix}:${ip}`;
      const result = await checkRateLimit(key, rule);

      if (!result.success) {
        return new NextResponse(
          JSON.stringify({
            error: "Too many requests. Please wait before trying again.",
            retryAfter: result.reset,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": result.reset.toString(),
              "X-RateLimit-Limit": result.limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": result.reset.toString(),
            },
          }
        );
      }
      break;
    }
  }

  // 2. Cron job authorization verification
  if (pathname.startsWith("/api/cron/")) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      const xCronSecret = request.headers.get("x-cron-secret");
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

      if (bearerToken !== cronSecret && xCronSecret !== cronSecret) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized: Invalid cron job authorization token" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // 3. Admin route guard (browser pages)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminSession = request.cookies.get("flashwear_admin_session");

    // In non-production, allow access if dev mode bypass is enabled or cookie is active
    const isDev = process.env.NODE_ENV !== "production";
    const hasActiveSession = adminSession?.value === "active";

    if (!hasActiveSession && !isDev) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Create base response & append HTTP Security Headers
  const response = NextResponse.next();

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://*.sslcommerz.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://*.sslcommerz.com https://www.google-analytics.com;
    connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.sslcommerz.com https://*.pathao.com https://sandbox.sslcommerz.com;
    frame-src 'self' https://*.sslcommerz.com https://sandbox.sslcommerz.com;
    frame-ancestors 'none';
    form-action 'self' https://*.sslcommerz.com https://sandbox.sslcommerz.com;
    base-uri 'self';
    object-src 'none';
  `.replace(/\s{2,}/g, " ").trim();

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "on");

  // HTTP Strict Transport Security (HSTS) in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
