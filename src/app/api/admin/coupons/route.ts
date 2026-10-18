import { NextResponse } from "next/server";
import { getAllCoupons, createCoupon, toggleCouponActive } from "@/lib/services/coupons";
import { requireAdmin } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const coupons = await getAllCoupons();
    return NextResponse.json(coupons);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const body = await request.json();
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount = 0,
      max_discount_amount = null,
      usage_limit = null,
      per_customer_limit = 1,
      is_active = true,
      starts_at = new Date().toISOString(),
      expires_at = null,
    } = body;

    if (!code || !discount_value || !discount_type) {
      return NextResponse.json({ error: "Missing required coupon fields" }, { status: 400 });
    }

    const created = await createCoupon({
      code: code.trim().toUpperCase(),
      description,
      discount_type,
      discount_value: Number(discount_value),
      min_order_amount: Number(min_order_amount),
      max_discount_amount: max_discount_amount ? Number(max_discount_amount) : null,
      usage_limit: usage_limit ? Number(usage_limit) : null,
      per_customer_limit: Number(per_customer_limit),
      is_active: Boolean(is_active),
      starts_at,
      expires_at: expires_at ? new Date(expires_at).toISOString() : null,
    });

    return NextResponse.json({ success: true, coupon: created });
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
    const { couponId, isActive } = body;
    if (!couponId) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }
    const success = await toggleCouponActive(couponId, isActive);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
