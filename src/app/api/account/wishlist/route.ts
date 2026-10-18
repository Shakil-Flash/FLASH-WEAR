import { NextResponse } from "next/server";
import { getCustomerWishlist, toggleWishlistItem } from "@/lib/services/accounts";
import { requireCustomer } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const wishlist = await getCustomerWishlist(auth.user.id);
    return NextResponse.json(wishlist);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const result = await toggleWishlistItem(auth.user.id, productId);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
