import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { isSupabaseConfigured } from "../supabase/client";
import { verifySignedAdminToken } from "./session-token";

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

/**
 * Get authenticated user from session cookies using @supabase/ssr
 */
export async function getAuthenticatedUser(request?: Request): Promise<AuthUser | null> {
  // 1. Try Supabase SSR Cookie Auth
  if (isSupabaseConfigured()) {
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
          },
        }
      );

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        return {
          id: user.id,
          email: user.email,
        };
      }
    } catch {
      // Supabase auth check failed or cookies unavailable
    }
  }

  // 2. Local development / testing mode fallback
  if (process.env.NODE_ENV !== "production") {
    // Check for test harness header in automated tests
    if (request) {
      const testUserId = request.headers.get("x-user-id");
      if (testUserId) {
        return {
          id: testUserId,
          email: "test-user@flashwear.store",
        };
      }
    }

    // Default development fallback for local store preview
    const cookieStore = cookies();
    const devAuth = cookieStore.get("flashwear_auth_user")?.value;
    if (devAuth) {
      try {
        return JSON.parse(devAuth);
      } catch {}
    }

    return {
      id: "usr-demo",
      email: "demo-customer@flashwear.store",
    };
  }

  return null;
}

/**
 * Require authorized staff/administrator session for admin routes
 */
export async function requireAdmin(
  request?: Request
): Promise<{ authorized: boolean; user?: AuthUser; error?: string; status: number }> {
  // 1. Check for development / testing admin bypass
  if (process.env.NODE_ENV !== "production") {
    // In dev / test, accept admin test key or cookie
    if (request) {
      const adminKey = request.headers.get("x-admin-key");
      const devAdminSecret = process.env.ADMIN_SECRET_KEY || "flashwear-dev-admin";
      if (adminKey === devAdminSecret) {
        return {
          authorized: true,
          user: { id: "usr-admin-dev", email: "admin@flashwear.store", role: "admin" },
          status: 200,
        };
      }
    }

    // Check for signed admin session cookie
    try {
      const cookieStore = cookies();
      const signedCookie = cookieStore.get("flashwear_admin_session")?.value;
      if (signedCookie) {
        const verified = await verifySignedAdminToken(signedCookie);
        if (verified.valid) {
          return {
            authorized: true,
            user: { id: verified.userId || "usr-admin-dev", email: "admin@flashwear.store", role: "admin" },
            status: 200,
          };
        }
      }
    } catch {}

    // In local development, if Supabase is not configured, grant access for preview
    if (!isSupabaseConfigured() && !isServiceRoleConfigured()) {
      return {
        authorized: true,
        user: { id: "usr-admin-dev", email: "admin@flashwear.store", role: "admin" },
        status: 200,
      };
    }
  }

  // Check for signed admin cookie in production as well
  try {
    const cookieStore = cookies();
    const signedCookie = cookieStore.get("flashwear_admin_session")?.value;
    if (signedCookie) {
      const verified = await verifySignedAdminToken(signedCookie);
      if (verified.valid) {
        return {
          authorized: true,
          user: { id: verified.userId || "usr-admin", email: "admin@flashwear.store", role: "admin" },
          status: 200,
        };
      }
    }
  } catch {}

  // 2. Production: Strictly verify Supabase session and database admin role
  if (!isSupabaseConfigured()) {
    return {
      authorized: false,
      error: "Authentication service unavailable in production.",
      status: 503,
    };
  }

  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        authorized: false,
        error: "Unauthorized: Administrator sign-in required.",
        status: 401,
      };
    }

    // Check database user_roles table
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return {
        authorized: false,
        error: "Forbidden: Account lacks administrative privileges.",
        status: 403,
      };
    }

    return {
      authorized: true,
      user: {
        id: user.id,
        email: user.email,
        role: "admin",
      },
      status: 200,
    };
  } catch (err: any) {
    return {
      authorized: false,
      error: err.message || "Admin authorization failed.",
      status: 500,
    };
  }
}

/**
 * Require authenticated customer session and enforce record ownership
 */
export async function requireCustomer(
  request?: Request
): Promise<{ authorized: boolean; user?: AuthUser; error?: string; status: number }> {
  const user = await getAuthenticatedUser(request);

  if (!user || !user.id) {
    return {
      authorized: false,
      error: "Unauthorized: Sign-in required to access customer account.",
      status: 401,
    };
  }

  return {
    authorized: true,
    user,
    status: 200,
  };
}
