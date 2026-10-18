import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { validateEnvironment } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const isReadiness = url.searchParams.get("type") === "readiness";

  const envStatus = validateEnvironment();

  // Basic Liveness Probe
  if (!isReadiness) {
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    });
  }

  // Deep Readiness Probe
  let databaseStatus: "connected" | "fallback_mock" | "error" = "fallback_mock";
  let databaseLatencyMs = 0;
  let hasDatabaseError = false;

  if (isSupabaseConfigured()) {
    try {
      const dbStart = Date.now();
      const { error } = await supabase.from("products").select("id").limit(1);
      databaseLatencyMs = Date.now() - dbStart;

      if (error) {
        databaseStatus = "error";
        hasDatabaseError = true;
      } else {
        databaseStatus = "connected";
      }
    } catch {
      databaseStatus = "error";
      hasDatabaseError = true;
    }
  }

  const overallStatus = hasDatabaseError && process.env.NODE_ENV === "production" ? "degraded" : "healthy";
  const statusCode = overallStatus === "healthy" ? 200 : 503;

  // Check if caller has administrative authorization for deep diagnostics
  const adminKey = request.headers.get("x-admin-key");
  const configuredAdminKey = process.env.ADMIN_SECRET_KEY || "flashwear-dev-admin";
  const isAuthorizedAdmin = adminKey === configuredAdminKey;

  const responseBody: Record<string, any> = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    uptimeSeconds: Math.floor(process.uptime()),
    dependencies: {
      database: {
        status: databaseStatus,
        mode: isSupabaseConfigured() ? "postgresql_supabase" : "in_memory_catalog",
      },
      paymentGateway: {
        sslcommerzLive: envStatus.features.sslcommerzLive,
        sslcommerzSandbox: envStatus.features.sslcommerzSandbox,
      },
      shippingProvider: {
        pathaoConfigured: envStatus.features.pathaoConfigured,
      },
      transactionalEmail: {
        resendConfigured: envStatus.features.emailConfigured,
      },
      backgroundJobs: {
        cronSecured: envStatus.features.cronSecretConfigured,
      },
    },
  };

  // Only expose internal runtime & memory metrics to authorized administrative callers
  if (isAuthorizedAdmin) {
    responseBody.system = {
      nodeVersion: process.version,
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
      },
      environment: process.env.NODE_ENV || "development",
    };
  }

  return NextResponse.json(responseBody, { status: statusCode });
}
