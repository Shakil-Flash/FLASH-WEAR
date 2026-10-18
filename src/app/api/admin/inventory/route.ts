import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import {
  getStockHealthSummary,
  fallbackStockAudits,
  adjustVariantStock,
} from "@/lib/services/inventory";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const summary = await getStockHealthSummary();

    return NextResponse.json({
      success: true,
      summary,
      recentAudits: fallbackStockAudits.slice(-50).reverse(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const body = await request.json();
    const { variantId, quantity, reason } = body;

    if (!variantId || quantity === undefined || typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json(
        { error: "Valid variantId and non-negative quantity required" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
      return NextResponse.json(
        { error: "An authorized operational reason (minimum 3 characters) is required for manual stock adjustments." },
        { status: 400 }
      );
    }

    const cleanReason = reason.trim();
    const adminUser = auth.user?.email || "admin@flashwear.store";

    const result = await adjustVariantStock(variantId, quantity, cleanReason, adminUser);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Variant not found" }, { status: 400 });
    }

    return NextResponse.json({ success: true, audit: result.audit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
