import { NextResponse } from "next/server";
import { supabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { INITIAL_PRODUCTS } from "@/lib/data/mock-catalog";
import { requireAdmin } from "@/lib/auth/server";

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const { variantId, quantity } = await request.json();

    if (!variantId || quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { error: "Valid variantId and non-negative quantity required" },
        { status: 400 }
      );
    }

    if (isServiceRoleConfigured()) {
      const { error } = await supabaseAdmin
        .from("product_variants")
        .update({
          inventory_quantity: quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", variantId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    // In-memory fallback
    for (const p of INITIAL_PRODUCTS) {
      const v = p.variants?.find((x) => x.id === variantId);
      if (v) {
        v.inventory_quantity = quantity;
        v.updated_at = new Date().toISOString();
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
