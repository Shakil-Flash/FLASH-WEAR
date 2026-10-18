import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, password, action } = await request.json();

    if (action === "logout") {
      const cookieStore = cookies();
      cookieStore.delete("flashwear_admin_session");
      if (isSupabaseConfigured()) {
        try {
          await supabase.auth.signOut();
        } catch {}
      }
      return NextResponse.json({ success: true, message: "Logged out successfully" });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Supabase Auth
    if (isSupabaseConfigured()) {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.user) {
        return NextResponse.json(
          { error: authError?.message || "Invalid email or password" },
          { status: 401 }
        );
      }

      // Verify admin role in DB
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError || !roleData) {
        await supabase.auth.signOut();
        return NextResponse.json(
          { error: "Access denied. Account lacks administrative permissions." },
          { status: 403 }
        );
      }

      const cookieStore = cookies();
      cookieStore.set("flashwear_admin_session", "active", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 hours
      });

      return NextResponse.json({
        success: true,
        user: { id: data.user.id, email: data.user.email, role: "admin" },
      });
    }

    // 2. Dev / Testing mode fallback
    if (process.env.NODE_ENV !== "production") {
      const validPass = password === "flashwear2026" || password === "admin123";
      if (!validPass) {
        return NextResponse.json(
          { error: "Invalid admin passphrase in preview mode." },
          { status: 401 }
        );
      }

      const cookieStore = cookies();
      cookieStore.set("flashwear_admin_session", "active", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });

      return NextResponse.json({
        success: true,
        user: { id: "usr-admin-dev", email, role: "admin" },
      });
    }

    return NextResponse.json(
      { error: "Authentication provider is not configured for production." },
      { status: 503 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Authentication error" }, { status: 500 });
  }
}
