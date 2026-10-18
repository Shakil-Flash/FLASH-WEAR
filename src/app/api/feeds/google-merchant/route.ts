import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flashwear.store";
  const products = await getAllProducts({ isPublished: true });

  const itemsXml = products
    .map((p) => {
      const totalInventory = p.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0;
      const availability = totalInventory > 0 ? "in stock" : "out of stock";
      const imageUrl = p.images?.[0]?.url || `${siteUrl}/icon.svg`;
      const description = (p.description || "FLASHWEAR Streetwear Apparel")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const title = p.name
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${siteUrl}/product/${p.slug}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${p.price.toFixed(2)} BDT</g:price>
      <g:brand>FLASHWEAR</g:brand>
      <g:condition>new</g:condition>
      <g:gender>unisex</g:gender>
      <g:age_group>adult</g:age_group>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>FLASHWEAR Streetwear Product Feed</title>
    <link>${siteUrl}</link>
    <description>Official Google Merchant Center Product Feed for FLASHWEAR Bangladesh</description>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
