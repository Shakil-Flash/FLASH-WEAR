#!/usr/bin/env node
/**
 * FLASHWEAR — Safe Production Catalog Importer
 *
 * Usage:
 *   node scripts/import-production-catalog.mjs --file ./catalog.json --dry-run
 *   node scripts/import-production-catalog.mjs --file ./catalog.json --confirm
 *
 * Rules:
 *   - NEVER overwrites existing products or variants.
 *   - NEVER alters prices or inventory quantities of existing SKUs.
 *   - Strict idempotency: can be run repeatedly without duplicating records.
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment from .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isConfirmed = args.includes("--confirm");
const fileIdx = args.indexOf("--file");
const filePath = fileIdx !== -1 && args[fileIdx + 1] ? args[fileIdx + 1] : null;

if (!filePath) {
  console.log(`
FLASHWEAR Production Catalog Importer
=====================================
Usage:
  node scripts/import-production-catalog.mjs --file <path-to-catalog.json> --dry-run
  node scripts/import-production-catalog.mjs --file <path-to-catalog.json> --confirm

Options:
  --file <path>   Path to valid JSON catalog export
  --dry-run       Preview additions and conflict detection without writing to DB
  --confirm       Execute non-destructive inserts into production database
`);
  process.exit(0);
}

if (!isDryRun && !isConfirmed) {
  console.error("Safety Error: You must specify either --dry-run or --confirm.");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runImport() {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: File not found at ${fullPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  const products = Array.isArray(rawData) ? rawData : rawData.products || [];

  console.log(`\nFound ${products.length} products to process in ${filePath}`);
  console.log(`Mode: ${isDryRun ? "DRY-RUN (Read-only Preview)" : "CONFIRMED (Non-Destructive Live Write)"}\n`);

  let newCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const item of products) {
    try {
      // 1. Check if product already exists by slug
      const { data: existing, error: checkErr } = await supabase
        .from("products")
        .select("id, name, slug, price")
        .eq("slug", item.slug)
        .maybeSingle();

      if (checkErr) {
        console.error(`Error checking product ${item.slug}:`, checkErr.message);
        errorCount++;
        continue;
      }

      if (existing) {
        console.log(`[SKIP - EXISTS] "${item.name}" (slug: ${item.slug}, DB ID: ${existing.id}). Preserving live price & inventory.`);
        skippedCount++;
        continue;
      }

      if (isDryRun) {
        console.log(`[DRY-RUN - NEW] Would insert: "${item.name}" (slug: ${item.slug}, Price: ৳${item.price}, Variants: ${item.variants?.length || 0})`);
        newCount++;
        continue;
      }

      // Live insertion
      const { data: newProd, error: insertErr } = await supabase
        .from("products")
        .insert({
          name: item.name,
          slug: item.slug,
          description: item.description,
          details: item.details,
          category_id: item.category_id,
          collection_id: item.collection_id || null,
          price: item.price,
          compare_at_price: item.compare_at_price || null,
          is_published: item.is_published ?? true,
          is_featured: item.is_featured ?? false,
          is_bestseller: item.is_bestseller ?? false,
        })
        .select()
        .single();

      if (insertErr || !newProd) {
        console.error(`Error inserting product "${item.name}":`, insertErr?.message);
        errorCount++;
        continue;
      }

      // Insert images
      if (item.images && item.images.length > 0) {
        const imageInserts = item.images.map((img, idx) => ({
          product_id: newProd.id,
          url: img.url || img,
          alt_text: img.alt_text || item.name,
          sort_order: img.sort_order ?? idx,
          is_primary: img.is_primary ?? (idx === 0),
        }));
        await supabase.from("product_images").insert(imageInserts);
      }

      // Insert variants
      if (item.variants && item.variants.length > 0) {
        const variantInserts = item.variants.map((v) => ({
          product_id: newProd.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          inventory_quantity: v.inventory_quantity || 0,
        }));
        await supabase.from("product_variants").insert(variantInserts);
      }

      console.log(`[INSERTED] "${item.name}" -> ID: ${newProd.id}`);
      newCount++;
    } catch (err) {
      console.error(`Exception processing product ${item.slug}:`, err.message);
      errorCount++;
    }
  }

  console.log("\n=================================");
  console.log(`Summary:`);
  console.log(`  New Products Processed:   ${newCount}`);
  console.log(`  Existing (Skipped/Saved): ${skippedCount}`);
  console.log(`  Errors:                   ${errorCount}`);
  console.log("=================================\n");
}

runImport().catch((err) => {
  console.error("Fatal Import Error:", err);
  process.exit(1);
});
