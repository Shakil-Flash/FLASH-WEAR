import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Phase 8: Production Deployment & Go-Live Readiness", () => {
  describe("1. Production Catalog Dataset Validation", () => {
    it("should verify catalog.json exists and is valid JSON", () => {
      const catalogPath = path.resolve(process.cwd(), "catalog.json");
      expect(fs.existsSync(catalogPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
      expect(content.store).toBe("FLASHWEAR");
      expect(Array.isArray(content.products)).toBe(true);
      expect(content.products.length).toBe(6);
    });

    it("should verify every product in catalog.json has valid SKUs, prices, images, and stock", () => {
      const catalogPath = path.resolve(process.cwd(), "catalog.json");
      const content = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));

      let totalVariants = 0;
      let totalUnits = 0;

      for (const p of content.products) {
        expect(p.name).toBeTruthy();
        expect(p.slug).toBeTruthy();
        expect(p.price).toBeGreaterThan(0);
        expect(p.category_id).toBeTruthy();
        expect(Array.isArray(p.images)).toBe(true);
        expect(p.images.length).toBeGreaterThan(0);

        for (const img of p.images) {
          expect(img.url.startsWith("https://images.unsplash.com/")).toBe(true);
        }

        expect(Array.isArray(p.variants)).toBe(true);
        expect(p.variants.length).toBeGreaterThan(0);

        for (const v of p.variants) {
          expect(v.sku).toMatch(/^FW-[A-Z]+-\d{2}-[A-Z0-9]+-[A-Z0-9]+$/);
          expect(v.size).toBeTruthy();
          expect(v.color).toBeTruthy();
          expect(v.inventory_quantity).toBeGreaterThanOrEqual(0);
          totalVariants++;
          totalUnits += v.inventory_quantity;
        }
      }

      expect(totalVariants).toBe(25);
      expect(totalUnits).toBe(394);
    });
  });

  describe("2. Deployment Configuration & Migration Integrity", () => {
    it("should verify all 5 SQL migrations exist and contain valid non-destructive statements", () => {
      const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

      expect(files.length).toBe(5);

      for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
        // Ensure no destructive DROP TABLE or DROP DATABASE commands
        expect(sql).not.toContain("DROP TABLE public.");
        expect(sql).not.toContain("DROP SCHEMA");
        expect(sql).not.toContain("DROP DATABASE");
      }
    });

    it("should verify vercel.json contains abandoned-cart cron schedule", () => {
      const vercelPath = path.resolve(process.cwd(), "vercel.json");
      const config = JSON.parse(fs.readFileSync(vercelPath, "utf-8"));
      expect(config.framework).toBe("nextjs");
      expect(config.crons.some((c: any) => c.path === "/api/cron/abandoned-carts")).toBe(true);
    });
  });
});
