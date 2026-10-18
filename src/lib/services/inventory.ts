import { supabaseAdmin, isServiceRoleConfigured } from "../supabase/admin";
import { INITIAL_PRODUCTS } from "../data/mock-catalog";
import { logger } from "../logger";

export interface StockAdjustmentAudit {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  reason: string;
  adjustedBy: string;
  createdAt: string;
}

export const fallbackStockAudits: StockAdjustmentAudit[] = [];

export async function getStockHealthSummary() {
  let allVariants: Array<{ id: string; sku: string; inventory_quantity: number }> = [];

  if (isServiceRoleConfigured()) {
    try {
      const { data } = await supabaseAdmin
        .from("product_variants")
        .select("id, sku, inventory_quantity");
      if (data) allVariants = data;
    } catch {}
  } else {
    allVariants = INITIAL_PRODUCTS.flatMap((p) => p.variants || []).map((v) => ({
      id: v.id,
      sku: v.sku,
      inventory_quantity: v.inventory_quantity,
    }));
  }

  const totalVariants = allVariants.length;
  const lowStockCount = allVariants.filter(
    (v) => v.inventory_quantity > 0 && v.inventory_quantity <= 5
  ).length;
  const outOfStockCount = allVariants.filter((v) => v.inventory_quantity === 0).length;
  const negativeStockCount = allVariants.filter((v) => v.inventory_quantity < 0).length;

  return {
    totalVariants,
    lowStockCount,
    outOfStockCount,
    negativeStockCount,
  };
}

export async function adjustVariantStock(
  variantId: string,
  quantity: number,
  reason: string,
  adminUser: string
): Promise<{ success: boolean; audit?: StockAdjustmentAudit; error?: string }> {
  let previousQuantity = 0;
  let sku = "";
  let productName = "";

  if (isServiceRoleConfigured()) {
    try {
      const { data: existingVariant } = await supabaseAdmin
        .from("product_variants")
        .select("id, sku, inventory_quantity, product:products(name)")
        .eq("id", variantId)
        .single();

      if (existingVariant) {
        previousQuantity = existingVariant.inventory_quantity;
        sku = existingVariant.sku;
        productName = (existingVariant.product as any)?.name || "Streetwear Item";
      }

      const { error } = await supabaseAdmin
        .from("product_variants")
        .update({
          inventory_quantity: quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", variantId);

      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  } else {
    let found = false;
    for (const p of INITIAL_PRODUCTS) {
      const v = p.variants?.find((x) => x.id === variantId);
      if (v) {
        previousQuantity = v.inventory_quantity;
        sku = v.sku;
        productName = p.name;
        v.inventory_quantity = quantity;
        v.updated_at = new Date().toISOString();
        found = true;
        break;
      }
    }
    if (!found) {
      return { success: false, error: "Variant not found" };
    }
  }

  const auditEntry: StockAdjustmentAudit = {
    id: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    variantId,
    sku: sku || variantId,
    productName: productName || "Product",
    previousQuantity,
    newQuantity: quantity,
    difference: quantity - previousQuantity,
    reason,
    adjustedBy: adminUser,
    createdAt: new Date().toISOString(),
  };
  fallbackStockAudits.push(auditEntry);

  logger.info("Manual inventory adjustment executed", {
    operation: "inventory_adjustment",
    data: {
      variantId,
      sku,
      previousQuantity,
      newQuantity: quantity,
      difference: quantity - previousQuantity,
      reason,
      adjustedBy: adminUser,
    },
  });

  return { success: true, audit: auditEntry };
}
