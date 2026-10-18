import { CustomerAddress, WishlistItem, Profile } from "../types";
import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { INITIAL_PRODUCTS } from "../data/mock-catalog";

// Fallback in-memory stores for offline development
export const fallbackAddresses: CustomerAddress[] = [
  {
    id: "addr-default",
    user_id: "usr-demo",
    label: "Home",
    full_name: "Tanzim Shakil",
    phone: "01712345678",
    division: "Dhaka",
    district: "Dhaka",
    address_line: "House 24, Road 7, Block D, Banani",
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const fallbackWishlist: WishlistItem[] = [
  {
    id: "wsh-1",
    user_id: "usr-demo",
    product_id: INITIAL_PRODUCTS[0].id,
    product: INITIAL_PRODUCTS[0],
    created_at: new Date().toISOString(),
  },
];

export const fallbackProfiles: Record<string, Profile> = {
  "usr-demo": {
    id: "usr-demo",
    email: "shakil@flashwear.store",
    full_name: "Tanzim Shakil",
    phone: "01712345678",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
};

// --- ADDRESS BOOK ---
export async function getCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("customer_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });
      if (!error && data) return data as CustomerAddress[];
    } catch {}
  }
  return fallbackAddresses.filter((a) => a.user_id === userId);
}

export async function addCustomerAddress(
  userId: string,
  data: Omit<CustomerAddress, "id" | "user_id" | "created_at" | "updated_at">
): Promise<CustomerAddress> {
  const newAddr: CustomerAddress = {
    ...data,
    id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (data.is_default) {
    // Demote other addresses
    fallbackAddresses.forEach((a) => {
      if (a.user_id === userId) a.is_default = false;
    });
  }

  if (isServiceRoleConfigured()) {
    try {
      if (data.is_default) {
        await supabaseAdmin
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("user_id", userId);
      }
      const { data: created, error } = await supabaseAdmin
        .from("customer_addresses")
        .insert({
          user_id: userId,
          label: newAddr.label,
          full_name: newAddr.full_name,
          phone: newAddr.phone,
          division: newAddr.division,
          district: newAddr.district,
          address_line: newAddr.address_line,
          is_default: newAddr.is_default,
        })
        .select()
        .single();
      if (!error && created) return created as CustomerAddress;
    } catch {}
  }

  fallbackAddresses.unshift(newAddr);
  return newAddr;
}

export async function deleteCustomerAddress(addressId: string, userId: string): Promise<boolean> {
  if (isServiceRoleConfigured()) {
    try {
      await supabaseAdmin
        .from("customer_addresses")
        .delete()
        .eq("id", addressId)
        .eq("user_id", userId);
      return true;
    } catch {}
  }
  const idx = fallbackAddresses.findIndex((a) => a.id === addressId && a.user_id === userId);
  if (idx !== -1) {
    fallbackAddresses.splice(idx, 1);
    return true;
  }
  return false;
}

// --- WISHLIST ---
export async function getCustomerWishlist(userId: string): Promise<WishlistItem[]> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("customer_wishlist")
        .select(`
          id,
          user_id,
          product_id,
          created_at,
          product:products (
            id,
            name,
            slug,
            price,
            compare_at_price,
            images:product_images(url)
          )
        `)
        .eq("user_id", userId);
      if (!error && data) return data as unknown as WishlistItem[];
    } catch {}
  }
  return fallbackWishlist.filter((w) => w.user_id === userId);
}

export async function toggleWishlistItem(
  userId: string,
  productId: string
): Promise<{ inWishlist: boolean }> {
  const existingIndex = fallbackWishlist.findIndex(
    (w) => w.user_id === userId && w.product_id === productId
  );

  if (existingIndex !== -1) {
    // Remove
    fallbackWishlist.splice(existingIndex, 1);
    if (isServiceRoleConfigured()) {
      try {
        await supabaseAdmin
          .from("customer_wishlist")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);
      } catch {}
    }
    return { inWishlist: false };
  } else {
    // Add
    const matchedProduct = INITIAL_PRODUCTS.find((p) => p.id === productId);
    const item: WishlistItem = {
      id: `wsh-${Date.now()}`,
      user_id: userId,
      product_id: productId,
      product: matchedProduct,
      created_at: new Date().toISOString(),
    };
    fallbackWishlist.unshift(item);
    if (isServiceRoleConfigured()) {
      try {
        await supabaseAdmin.from("customer_wishlist").insert({
          user_id: userId,
          product_id: productId,
        });
      } catch {}
    }
    return { inWishlist: true };
  }
}

// --- PROFILE ---
export async function getCustomerProfile(userId: string): Promise<Profile | null> {
  if (isServiceRoleConfigured()) {
    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (!error && data) return data as Profile;
    } catch {}
  }
  return fallbackProfiles[userId] || null;
}

export async function updateCustomerProfile(
  userId: string,
  data: { fullName?: string; phone?: string }
): Promise<Profile | null> {
  if (isServiceRoleConfigured()) {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (data.fullName !== undefined) updateData.full_name = data.fullName;
      if (data.phone !== undefined) updateData.phone = data.phone;

      const { data: updated, error } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();
      if (!error && updated) return updated as Profile;
    } catch {}
  }

  if (fallbackProfiles[userId]) {
    if (data.fullName !== undefined) fallbackProfiles[userId].full_name = data.fullName;
    if (data.phone !== undefined) fallbackProfiles[userId].phone = data.phone;
    fallbackProfiles[userId].updated_at = new Date().toISOString();
    return fallbackProfiles[userId];
  }

  const newProfile: Profile = {
    id: userId,
    email: "customer@flashwear.store",
    full_name: data.fullName || "Customer",
    phone: data.phone || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  fallbackProfiles[userId] = newProfile;
  return newProfile;
}
