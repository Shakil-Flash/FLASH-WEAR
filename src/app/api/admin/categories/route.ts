import { NextResponse } from "next/server";
import { supabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { INITIAL_CATEGORIES } from "@/lib/data/mock-catalog";
import { Category } from "@/lib/types";
import { requireAdmin } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const { name, slug, description, imageUrl } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    if (isServiceRoleConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("categories")
        .insert({
          name,
          slug,
          description: description || null,
          image_url: imageUrl || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, category: data });
    }

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      description: description || null,
      image_url: imageUrl || null,
      is_active: true,
      sort_order: INITIAL_CATEGORIES.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    INITIAL_CATEGORIES.push(newCat);
    return NextResponse.json({ success: true, category: newCat });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
