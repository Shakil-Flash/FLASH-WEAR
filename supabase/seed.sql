-- FLASHWEAR Seed Data
-- Premium streetwear catalog with Bangladeshi Taka (BDT) pricing

-- 1. CATEGORIES
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Hoodies & Sweats', 'hoodies-sweats', 'Heavyweight French terry hoodies and technical crewnecks designed for modern comfort.', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80', 1),
  ('c2222222-2222-2222-2222-222222222222', 'Graphic Tees', 'graphic-tees', '240 GSM drop-shoulder tees featuring bold typography and minimal futuristic graphics.', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80', 2),
  ('c3333333-3333-3333-3333-333333333333', 'Cargo & Pants', 'cargo-pants', 'Utilitarian cargo trousers, tactical joggers, and relaxed wide-leg denim.', 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80', 3),
  ('c4444444-4444-4444-4444-444444444444', 'Outerwear & Jackets', 'outerwear', 'Technical windbreakers, bomber jackets, and modular utility vests.', 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80', 4),
  ('c5555555-5555-5555-5555-555555555555', 'Accessories', 'accessories', 'Tactical cross-body bags, structured caps, and minimalist street essentials.', 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1000&q=80', 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- 2. COLLECTIONS
INSERT INTO public.collections (id, name, slug, description, image_url, sort_order)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Drop 01: Cyber Circuit', 'drop-01-cyber-circuit', 'The inaugural capsule blending raw brutalist architecture with sharp neon technical accents.', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', 1),
  ('b2222222-2222-2222-2222-222222222222', 'Monochrome Core', 'monochrome-core', 'Timeless streetwear staples in deep obsidian black, raw ecru, and slate gray.', 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80', 2),
  ('b3333333-3333-3333-3333-333333333333', 'Tactical Transit', 'tactical-transit', 'Engineered mobility silhouettes with water-resistant ripstop and modular utility pockets.', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- 3. PRODUCTS
INSERT INTO public.products (id, name, slug, description, details, category_id, collection_id, price, compare_at_price, is_published, is_featured, is_bestseller)
VALUES
  (
    'p1111111-1111-1111-1111-111111111111',
    'FLASH Matrix Oversized Hoodie',
    'flash-matrix-oversized-hoodie',
    'Constructed from custom 480 GSM heavy brushed French terry cotton. Engineered with an exaggerated drop shoulder, double-layered hood without drawstrings, and high-density 3D rubberized logo branding across the spine.',
    '• 100% Organic Heavyweight Cotton (480 GSM)
• Pre-shrunk and silicone washed for ultra-soft hand feel
• Hidden kangaroo pocket with bar-tack reinforcement
• Machine wash cold inside out, hang dry in shade',
    'c1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    3450.00,
    3950.00,
    true,
    true,
    true
  ),
  (
    'p2222222-2222-2222-2222-222222222222',
    'Cyber Acid Graphic Tee',
    'cyber-acid-graphic-tee',
    'Relaxed boxy silhouette crafted from premium 240 GSM combed cotton. Showcases distressed typographic screen print inspired by underground electronics culture, accented with electric-lime micro tag on hem.',
    '• 240 GSM 100% Combed Cotton
• High-density plastisol and puff screen print
• Ribbed 1.25" crewneck collar that maintains shape
• Wash cold, iron on reverse side',
    'c2222222-2222-2222-2222-222222222222',
    'b1111111-1111-1111-1111-111111111111',
    1650.00,
    1850.00,
    true,
    true,
    true
  ),
  (
    'p3333333-3333-3333-3333-333333333333',
    'Transit Tactical Cargo Pant',
    'transit-tactical-cargo-pant',
    'Utility pants engineered with 8 ergonomic pockets, articulated knee darts for natural movement, and adjustable bungee toggles at the ankle cuffs for versatile styling from straight to tapered.',
    '• Durable cotton-ripstop blend with slight stretch
• Fidlock-inspired magnetic pocket flaps
• YKK metal zippers throughout
• Hand wash cold or gentle machine cycle',
    'c3333333-3333-3333-3333-333333333333',
    'b3333333-3333-3333-3333-333333333333',
    4200.00,
    4800.00,
    true,
    true,
    false
  ),
  (
    'p4444444-4444-4444-4444-444444444444',
    'Stealth Windbreaker Jacket',
    'stealth-windbreaker-jacket',
    'Water-repellent technical outerwear featuring a two-way matte zipper, storm flap, concealed zip chest pocket, and high-visibility reflective FLASHWEAR branding on the rear collar.',
    '• Lightweight 100% recycled nylon shell
• DWR (Durable Water Repellent) matte finish
• Breathable mesh lining
• Wipe clean with damp cloth or cold delicate wash',
    'c4444444-4444-4444-4444-444444444444',
    'b3333333-3333-3333-3333-333333333333',
    4950.00,
    null,
    true,
    true,
    false
  ),
  (
    'p5555555-5555-5555-5555-555555555555',
    'Core Monolith Heavy Tee',
    'core-monolith-heavy-tee',
    'The foundational piece of the FLASHWEAR wardrobe. A clean, heavyweight tee with an architectural drape, tailored seam lines, and tonal embroidered logo on the chest.',
    '• 260 GSM Ultra-dense combed jersey
• Clean seamless sides with reinforced split hem
• Minimal tone-on-tone embroidery
• Cold wash with similar colors',
    'c2222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    1550.00,
    null,
    true,
    false,
    true
  ),
  (
    'p6666666-6666-6666-6666-666666666666',
    'Vektor Modular Crossbody Bag',
    'vektor-modular-crossbody-bag',
    'Compact utilitarian sling crafted from Cordura 1000D ballistic nylon. Features waterproof taped zips, internal mesh organization dividers, and removable webbing strap with quick-release buckle.',
    '• Cordura® 1000D Ballistic Nylon
• Waterproof PU-coated reverse zips
• 2.5L capacity (Dimensions: 22cm x 15cm x 7cm)
• Spot clean only',
    'c5555555-5555-5555-5555-555555555555',
    'b1111111-1111-1111-1111-111111111111',
    1950.00,
    2250.00,
    true,
    true,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  details = EXCLUDED.details,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price;

-- 4. PRODUCT IMAGES
INSERT INTO public.product_images (product_id, url, alt_text, sort_order)
VALUES
  -- Matrix Hoodie
  ('p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85', 'FLASH Matrix Oversized Hoodie Front', 0),
  ('p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=85', 'FLASH Matrix Oversized Hoodie Model', 1),
  ('p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=85', 'FLASH Matrix Oversized Hoodie Detail', 2),

  -- Cyber Acid Tee
  ('p2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85', 'Cyber Acid Graphic Tee Front View', 0),
  ('p2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85', 'Cyber Acid Graphic Tee Model Fit', 1),

  -- Transit Cargo Pant
  ('p3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1200&q=85', 'Transit Tactical Cargo Pant Full View', 0),
  ('p3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85', 'Transit Tactical Cargo Pant Side Pockets', 1),

  -- Stealth Windbreaker
  ('p4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=85', 'Stealth Windbreaker Jacket Front', 0),
  ('p4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=85', 'Stealth Windbreaker Jacket Rear Branding', 1),

  -- Core Monolith Tee
  ('p5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=85', 'Core Monolith Heavy Tee Front View', 0),
  ('p5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=85', 'Core Monolith Heavy Tee Lifestyle', 1),

  -- Crossbody Bag
  ('p6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=85', 'Vektor Modular Crossbody Bag Front', 0),
  ('p6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85', 'Vektor Modular Crossbody Bag On Body', 1);

-- 5. PRODUCT VARIANTS (Sizes, Colors, SKUs, Stock)
INSERT INTO public.product_variants (product_id, size, color, sku, inventory_quantity)
VALUES
  -- Matrix Hoodie (Obsidian Black)
  ('p1111111-1111-1111-1111-111111111111', 'M', 'Obsidian Black', 'FW-HD-01-BLK-M', 18),
  ('p1111111-1111-1111-1111-111111111111', 'L', 'Obsidian Black', 'FW-HD-01-BLK-L', 25),
  ('p1111111-1111-1111-1111-111111111111', 'XL', 'Obsidian Black', 'FW-HD-01-BLK-XL', 12),
  -- Matrix Hoodie (Concrete Gray)
  ('p1111111-1111-1111-1111-111111111111', 'M', 'Concrete Gray', 'FW-HD-01-GRY-M', 10),
  ('p1111111-1111-1111-1111-111111111111', 'L', 'Concrete Gray', 'FW-HD-01-GRY-L', 14),

  -- Cyber Acid Tee (Washed Black)
  ('p2222222-2222-2222-2222-222222222222', 'S', 'Washed Black', 'FW-TEE-01-WBLK-S', 15),
  ('p2222222-2222-2222-2222-222222222222', 'M', 'Washed Black', 'FW-TEE-01-WBLK-M', 30),
  ('p2222222-2222-2222-2222-222222222222', 'L', 'Washed Black', 'FW-TEE-01-WBLK-L', 22),
  ('p2222222-2222-2222-2222-222222222222', 'XL', 'Washed Black', 'FW-TEE-01-WBLK-XL', 8),
  -- Cyber Acid Tee (Chalk White)
  ('p2222222-2222-2222-2222-222222222222', 'M', 'Chalk White', 'FW-TEE-01-WHT-M', 16),
  ('p2222222-2222-2222-2222-222222222222', 'L', 'Chalk White', 'FW-TEE-01-WHT-L', 18),

  -- Transit Cargo Pant (Matte Black)
  ('p3333333-3333-3333-3333-333333333333', '30 (S)', 'Matte Black', 'FW-CRG-01-BLK-30', 9),
  ('p3333333-3333-3333-3333-333333333333', '32 (M)', 'Matte Black', 'FW-CRG-01-BLK-32', 17),
  ('p3333333-3333-3333-3333-333333333333', '34 (L)', 'Matte Black', 'FW-CRG-01-BLK-34', 11),
  -- Transit Cargo Pant (Olive Drab)
  ('p3333333-3333-3333-3333-333333333333', '32 (M)', 'Olive Drab', 'FW-CRG-01-OLV-32', 8),

  -- Stealth Windbreaker (Pitch Black)
  ('p4444444-4444-4444-4444-444444444444', 'M', 'Pitch Black', 'FW-JKT-01-BLK-M', 12),
  ('p4444444-4444-4444-4444-444444444444', 'L', 'Pitch Black', 'FW-JKT-01-BLK-L', 15),
  ('p4444444-4444-4444-4444-444444444444', 'XL', 'Pitch Black', 'FW-JKT-01-BLK-XL', 6),

  -- Core Monolith Tee (Vintage Ecru)
  ('p5555555-5555-5555-5555-555555555555', 'S', 'Vintage Ecru', 'FW-TEE-02-ECR-S', 14),
  ('p5555555-5555-5555-5555-555555555555', 'M', 'Vintage Ecru', 'FW-TEE-02-ECR-M', 28),
  ('p5555555-5555-5555-5555-555555555555', 'L', 'Vintage Ecru', 'FW-TEE-02-ECR-L', 20),
  -- Core Monolith Tee (Coal Gray)
  ('p5555555-5555-5555-5555-555555555555', 'M', 'Coal Gray', 'FW-TEE-02-GRY-M', 15),
  ('p5555555-5555-5555-5555-555555555555', 'L', 'Coal Gray', 'FW-TEE-02-GRY-L', 12),

  -- Vektor Crossbody (Cyber Black)
  ('p6666666-6666-6666-6666-666666666666', 'ONE SIZE', 'Cyber Black', 'FW-BAG-01-BLK-OS', 24),
  ('p6666666-6666-6666-6666-666666666666', 'ONE SIZE', 'Acid Lime Trim', 'FW-BAG-01-LME-OS', 15)
ON CONFLICT (sku) DO NOTHING;
