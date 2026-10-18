import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { markOrderPaid, updateAdminOrderStatus, cancelOrderAndRestoreStock } from "@/lib/services/orders";
import { adjustVariantStock } from "@/lib/services/inventory";
import { getCategories, getCollections, getProducts, getProductBySlug } from "@/lib/services/catalog";
import { PathaoCourierAdapter } from "@/lib/shipping/courier";
import fs from "fs";
import path from "path";

describe("Phase 7: Production Infrastructure & Persistent Storage Hardening", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as any).NODE_ENV = originalNodeEnv;
  });

  describe("1. Unsafe In-Memory Fallback Prevention in Production", () => {
    it("should reject markOrderPaid in production when database is unconfigured", async () => {
      (process.env as any).NODE_ENV = "production";
      const result = await markOrderPaid("ord-test-dummy", {
        tranId: "TXN-TEST-123",
        valId: "VAL-TEST-456",
        amount: 2500,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Production database is not configured");
    });

    it("should reject updateAdminOrderStatus in production when database is unconfigured", async () => {
      (process.env as any).NODE_ENV = "production";
      const result = await updateAdminOrderStatus("ord-test-dummy", "confirmed");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Production database is not configured");
    });

    it("should reject cancelOrderAndRestoreStock in production when database is unconfigured", async () => {
      (process.env as any).NODE_ENV = "production";
      const result = await cancelOrderAndRestoreStock("ord-test-dummy", "Admin cancel");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Production database is not configured");
    });

    it("should reject adjustVariantStock in production when database is unconfigured", async () => {
      (process.env as any).NODE_ENV = "production";
      const result = await adjustVariantStock("v-test", 10, "Manual count", "admin@flashwear.store");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Production database is not configured");
    });

    it("should return empty arrays in production rather than leaking mock catalog data", async () => {
      (process.env as any).NODE_ENV = "production";

      const categories = await getCategories();
      expect(categories).toEqual([]);

      const collections = await getCollections();
      expect(collections).toEqual([]);

      const products = await getProducts();
      expect(products).toEqual([]);

      const product = await getProductBySlug("flash-matrix-oversized-hoodie");
      expect(product).toBeNull();
    });

    it("should not fabricate fake consignment IDs in production when Pathao is unconfigured", async () => {
      (process.env as any).NODE_ENV = "production";
      const adapter = new PathaoCourierAdapter();

      const result = await adapter.createShipment({
        orderId: "ord-test",
        orderNumber: "FLW-TEST",
        recipientName: "Test User",
        recipientPhone: "01700000000",
        recipientAddress: "Dhanmondi, Dhaka",
        recipientCity: "Dhaka",
        deliveryFee: 70,
        codAmount: 0,
        itemQuantity: 1,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("not_shipped");
      expect(result.consignmentId).toBeUndefined();
      expect(result.error).toContain("credentials are not configured in production");
    });
  });

  describe("2. Production Deployment & Security Configurations", () => {
    it("should verify next.config.mjs defines production security headers", async () => {
      const configPath = path.resolve(process.cwd(), "next.config.mjs");
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, "utf-8");

      expect(content).toContain("X-Frame-Options");
      expect(content).toContain("SAMEORIGIN");
      expect(content).toContain("X-Content-Type-Options");
      expect(content).toContain("nosniff");
      expect(content).toContain("Strict-Transport-Security");
      expect(content).toContain("max-age=63072000");
    });

    it("should verify vercel.json defines scheduled cron jobs", () => {
      const vercelPath = path.resolve(process.cwd(), "vercel.json");
      expect(fs.existsSync(vercelPath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(vercelPath, "utf-8"));

      expect(content.framework).toBe("nextjs");
      expect(Array.isArray(content.crons)).toBe(true);
      expect(content.crons.some((c: any) => c.path === "/api/cron/abandoned-carts")).toBe(true);
    });

    it("should verify Phase 7 migration exists with atomic procedures and stock audit table", () => {
      const migrationPath = path.resolve(
        process.cwd(),
        "supabase/migrations/20261018000000_phase7_production_storage_hardening.sql"
      );
      expect(fs.existsSync(migrationPath)).toBe(true);
      const sql = fs.readFileSync(migrationPath, "utf-8");

      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.stock_adjustment_audits");
      expect(sql).toContain("adjust_stock_atomic");
      expect(sql).toContain("redeem_coupon_atomic");
      expect(sql).toContain("Users view own order items");
    });

    it("should verify non-destructive production catalog import assets exist", () => {
      const sqlPath = path.resolve(process.cwd(), "supabase/catalog-production-safe-import.sql");
      const scriptPath = path.resolve(process.cwd(), "scripts/import-production-catalog.mjs");

      expect(fs.existsSync(sqlPath)).toBe(true);
      expect(fs.existsSync(scriptPath)).toBe(true);

      const sql = fs.readFileSync(sqlPath, "utf-8");
      expect(sql).toContain("ON CONFLICT (slug) DO NOTHING");
      expect(sql).toContain("safe_import_production_product");
    });
  });
});
