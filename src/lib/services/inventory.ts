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
      // 1. Try atomic RPC procedure if migration is applied
      const { data: rpcAudit, error: rpcError } = await supabaseAdmin.rpc("adjust_stock_atomic", {
        p_variant_id: variantId,
        p_new_quantity: quantity,
        p_reason: reason,
        p_adjusted_by: adminUser,
      });

      if (!rpcError && rpcAudit) {
        const audit = rpcAudit as any;
        const auditEntry: StockAdjustmentAudit = {
          id: audit.id || `adj-${Date.now()}`,
          variantId: audit.variant_id || variantId,
          sku: audit.sku || variantId,
          productName: audit.product_name || "Streetwear Item",
          previousQuantity: audit.previous_quantity,
          newQuantity: audit.new_quantity,
          difference: audit.difference,
          reason: audit.reason,
          adjustedBy: audit.adjusted_by,
          createdAt: audit.created_at || new Date().toISOString(),
        };
        return { success: true, audit: auditEntry };
      }

      // Fallback direct update & audit log
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

      try {
        await supabaseAdmin.from("stock_adjustment_audits").insert({
          variant_id: variantId,
          sku: sku || variantId,
          product_name: productName || "Streetwear Item",
          previous_quantity: previousQuantity,
          new_quantity: quantity,
          difference: quantity - previousQuantity,
          reason,
          adjusted_by: adminUser,
        });
      } catch (auditErr) {
        console.warn("Stock adjustment audit insert warning:", auditErr);
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      return {
        success: false,
        error: "Production database is not configured. Inventory adjustment rejected.",
      };
    }

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
