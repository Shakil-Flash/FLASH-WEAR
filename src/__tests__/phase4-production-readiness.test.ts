import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeData } from "@/lib/logger";
import { validateEnvironment } from "@/lib/env";
import { requireAdmin, requireCustomer } from "@/lib/auth/server";

describe("Phase 4: Production Readiness, Security & Reliability", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Structured Logger Redaction", () => {
    it("redacts sensitive keys including passwords, tokens, secrets, and card details", () => {
      const sensitiveInput = {
        username: "admin_user",
        password: "super-secret-password-123",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        apiKey: "flw_live_998877665544",
        supabase_service_role_key: "eyJhbGciOi...",
        cardNumber: "4111222233334444",
        cvv: "123",
        nested: {
          clientSecret: "pathao_secret_abc",
          safeNote: "Regular customer delivery comment",
        },
      };

      const sanitized = sanitizeData(sensitiveInput);

      expect(sanitized.username).toBe("admin_user");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.apiKey).toBe("[REDACTED]");
      expect(sanitized.supabase_service_role_key).toBe("[REDACTED]");
      expect(sanitized.cardNumber).toBe("[REDACTED]");
      expect(sanitized.cvv).toBe("[REDACTED]");
      expect(sanitized.nested.clientSecret).toBe("[REDACTED]");
      expect(sanitized.nested.safeNote).toBe("Regular customer delivery comment");
    });

    it("redacts bearer tokens in string fields", () => {
      const authHeader = "Bearer secret-access-token-xyz";
      const sanitized = sanitizeData(authHeader);
      expect(sanitized).toBe("Bearer [REDACTED]");
    });
  });

  describe("2. Rate Limiting", () => {
    it("permits requests within allowed threshold and blocks excess attempts", async () => {
      const ipKey = `test-ip-${Date.now()}`;
      const options = { limit: 3, windowMs: 1000 };

      const res1 = await checkRateLimit(ipKey, options);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = await checkRateLimit(ipKey, options);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = await checkRateLimit(ipKey, options);
      expect(res3.success).toBe(true);
      expect(res3.remaining).toBe(0);

      // 4th request must be rate limited
      const res4 = await checkRateLimit(ipKey, options);
      expect(res4.success).toBe(false);
      expect(res4.remaining).toBe(0);
      expect(res4.reset).toBeGreaterThan(0);
    });

    it("extracts client IP from x-forwarded-for header", () => {
      const req = new Request("http://localhost:3000/api/checkout", {
        headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
      });
      const ip = getClientIp(req);
      expect(ip).toBe("203.0.113.195");
    });
  });

  describe("3. Environment Validation", () => {
    it("validates environment schema and produces feature checklist", () => {
      const result = validateEnvironment();

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("isProduction");
      expect(result).toHaveProperty("features");
      expect(result.features).toHaveProperty("supabaseConfigured");
      expect(result.features).toHaveProperty("mockPaymentGatewayEnabled");
      expect(result.features).toHaveProperty("sslcommerzLive");
    });

    it("flags missing production supabase keys with errors in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      try {
        (process.env as any).NODE_ENV = "production";
        process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co";

        const result = validateEnvironment();
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some((e) => e.includes("NEXT_PUBLIC_SUPABASE_URL"))).toBe(true);
      } finally {
        (process.env as any).NODE_ENV = originalEnv;
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      }
    });
  });

  describe("4. Server-Side Authentication & Authorization", () => {
    it("grants admin access with valid test admin key header", async () => {
      const req = new Request("http://localhost:3000/api/admin/orders", {
        headers: { "x-admin-key": "flashwear-dev-admin" },
      });

      const auth = await requireAdmin(req);
      expect(auth.authorized).toBe(true);
      expect(auth.user?.role).toBe("admin");
    });

    it("scopes customer authentication and enforces authenticated session ID", async () => {
      const req = new Request("http://localhost:3000/api/account/profile", {
        headers: { "x-user-id": "usr-test-customer-42" },
      });

      const auth = await requireCustomer(req);
      expect(auth.authorized).toBe(true);
      expect(auth.user?.id).toBe("usr-test-customer-42");
    });
  });
});
