import { NextResponse } from "next/server";
import { supabaseAdmin, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { INITIAL_SETTINGS } from "@/lib/data/mock-catalog";
import { requireAdmin } from "@/lib/auth/server";

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Forbidden" }, { status: auth.status });
    }

    const body = await request.json();
    const {
      storeName,
      contactEmail,
      contactPhone,
      dhakaDeliveryFee,
      outsideDhakaDeliveryFee,
      lowStockThreshold,
      freeShippingThreshold,
      announcementText,
    } = body;

    if (isServiceRoleConfigured()) {
      const { error } = await supabaseAdmin
        .from("site_settings")
        .update({
          store_name: storeName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          dhaka_delivery_fee: parseFloat(dhakaDeliveryFee),
          outside_dhaka_delivery_fee: parseFloat(outsideDhakaDeliveryFee),
          low_stock_threshold: parseInt(lowStockThreshold),
          free_shipping_threshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
          announcement_text: announcementText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    // In-memory fallback
    INITIAL_SETTINGS.store_name = storeName || INITIAL_SETTINGS.store_name;
    INITIAL_SETTINGS.contact_email = contactEmail || INITIAL_SETTINGS.contact_email;
    INITIAL_SETTINGS.contact_phone = contactPhone || INITIAL_SETTINGS.contact_phone;
    if (dhakaDeliveryFee) INITIAL_SETTINGS.dhaka_delivery_fee = parseFloat(dhakaDeliveryFee);
    if (outsideDhakaDeliveryFee) INITIAL_SETTINGS.outside_dhaka_delivery_fee = parseFloat(outsideDhakaDeliveryFee);
    if (lowStockThreshold) INITIAL_SETTINGS.low_stock_threshold = parseInt(lowStockThreshold);
    if (freeShippingThreshold !== undefined) {
      INITIAL_SETTINGS.free_shipping_threshold = freeShippingThreshold ? parseFloat(freeShippingThreshold) : null;
    }
    if (announcementText) INITIAL_SETTINGS.announcement_text = announcementText;
    INITIAL_SETTINGS.updated_at = new Date().toISOString();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
