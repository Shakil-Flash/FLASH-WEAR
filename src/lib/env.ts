import { z } from "zod";

/**
 * Environment Variables Schema & Production Validation
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  
  // Supabase public configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  
  // Supabase private service role key
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),

  // Payments (SSLCOMMERZ)
  SSLCOMMERZ_STORE_ID: z.string().optional().or(z.literal("")),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional().or(z.literal("")),
  SSLCOMMERZ_IS_SANDBOX: z.string().optional().default("true"),
  ENABLE_MOCK_PAYMENT_GATEWAY: z.string().optional().default("false"),

  // Logistics (Pathao Courier)
  PATHAO_CLIENT_ID: z.string().optional().or(z.literal("")),
  PATHAO_CLIENT_SECRET: z.string().optional().or(z.literal("")),
  PATHAO_USERNAME: z.string().optional().or(z.literal("")),
  PATHAO_PASSWORD: z.string().optional().or(z.literal("")),
  PATHAO_STORE_ID: z.string().optional().or(z.literal("")),
  PATHAO_IS_SANDBOX: z.string().optional().default("true"),

  // Transactional Email & Notifications
  RESEND_API_KEY: z.string().optional().or(z.literal("")),
  STORE_FROM_EMAIL: z.string().email().optional().default("orders@flashwear.store"),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional().default("admin@flashwear.store"),
  MARKETING_EMAIL_FROM: z.string().email().optional().default("drops@flashwear.store"),

  // Background Cron Secret
  CRON_SECRET: z.string().optional().or(z.literal("")),

  // Analytics & Observability
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional().or(z.literal("")),
  SENTRY_DSN: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().or(z.literal("")),
  
  // App Version
  NEXT_PUBLIC_APP_VERSION: z.string().optional().default("1.0.0"),
});

export interface EnvValidationResult {
  valid: boolean;
  isProduction: boolean;
  errors: string[];
  warnings: string[];
  features: {
    supabaseConfigured: boolean;
    serviceRoleConfigured: boolean;
    sslcommerzLive: boolean;
    sslcommerzSandbox: boolean;
    mockPaymentGatewayEnabled: boolean;
    pathaoConfigured: boolean;
    emailConfigured: boolean;
    cronSecretConfigured: boolean;
    analyticsConfigured: boolean;
    sentryConfigured: boolean;
  };
}

export function validateEnvironment(): EnvValidationResult {
  const parsed = envSchema.safeParse(process.env);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!parsed.success) {
    parsed.error.errors.forEach((err) => {
      errors.push(`${err.path.join(".")}: ${err.message}`);
    });
  }

  const isProd = process.env.NODE_ENV === "production";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const mockGateway = process.env.ENABLE_MOCK_PAYMENT_GATEWAY === "true";
  const sslczStoreId = process.env.SSLCOMMERZ_STORE_ID || "";
  const sslczStorePass = process.env.SSLCOMMERZ_STORE_PASSWORD || "";
  const sslczSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
  const resendKey = process.env.RESEND_API_KEY || "";
  const cronSecret = process.env.CRON_SECRET || "";
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";

  // Production checks
  if (isProd) {
    if (!supabaseUrl || supabaseUrl.includes("your-project")) {
      errors.push("NEXT_PUBLIC_SUPABASE_URL is missing or contains placeholder in production.");
    }
    if (!supabaseAnon || supabaseAnon.includes("your-anon-key")) {
      errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or contains placeholder in production.");
    }
    if (!serviceRole || serviceRole.includes("your-service-role")) {
      errors.push("SUPABASE_SERVICE_ROLE_KEY is missing or contains placeholder in production.");
    }
    if (mockGateway) {
      warnings.push("CRITICAL WARNING: ENABLE_MOCK_PAYMENT_GATEWAY is enabled in production mode!");
    }
    if (!cronSecret || cronSecret.includes("your-secure-cron")) {
      warnings.push("CRON_SECRET is unconfigured or default. Background cron endpoints are unprotected.");
    }
    if (!sslczStoreId && !mockGateway) {
      warnings.push("SSLCOMMERZ payment credentials are missing; only Cash on Delivery will function.");
    }
    if (sslczStoreId && sslczSandbox) {
      warnings.push("SSLCOMMERZ_IS_SANDBOX is set to true in production. Online payments are in sandbox test mode.");
    }
    if (!resendKey) {
      warnings.push("RESEND_API_KEY is not set. Order emails and campaign newsletters will run in simulated mode.");
    }
  } else {
    // Development warnings
    if (!supabaseUrl) {
      warnings.push("NEXT_PUBLIC_SUPABASE_URL is not set. Running in local memory-backed catalog mode.");
    }
  }

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnon && !supabaseUrl.includes("your-project"));
  const serviceRoleConfigured = Boolean(serviceRole && !serviceRole.includes("your-service-role"));

  return {
    valid: errors.length === 0,
    isProduction: isProd,
    errors,
    warnings,
    features: {
      supabaseConfigured,
      serviceRoleConfigured,
      sslcommerzLive: Boolean(sslczStoreId && sslczStorePass && !sslczSandbox),
      sslcommerzSandbox: Boolean(sslczStoreId && sslczSandbox),
      mockPaymentGatewayEnabled: mockGateway || !isProd,
      pathaoConfigured: Boolean(process.env.PATHAO_CLIENT_ID && process.env.PATHAO_CLIENT_SECRET),
      emailConfigured: Boolean(resendKey),
      cronSecretConfigured: Boolean(cronSecret && !cronSecret.includes("your-secure-cron")),
      analyticsConfigured: Boolean(gaId),
      sentryConfigured: Boolean(sentryDsn),
    },
  };
}
