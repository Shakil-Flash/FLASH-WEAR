"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Product, ProductVariant } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import { useCart } from "@/lib/cart-context";
import { SizeGuideModal } from "@/components/size-guide-modal";
import { ProductCard } from "@/components/product-card";
import {
  Check,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Plus,
  Minus,
  ZoomIn,
  X,
} from "lucide-react";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const variants = useMemo(() => product.variants || [], [product.variants]);
  const images = useMemo(() => product.images || [], [product.images]);

  // Extract unique colors and sizes from variants
  const availableColors = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color))),
    [variants]
  );
  const availableSizes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size))),
    [variants]
  );

  // Initial state: pick first color and size if available
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || "");
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || "");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Find exact active variant
  const currentVariant = useMemo(() => {
    return variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );
  }, [variants, selectedColor, selectedSize]);

  const stock = currentVariant ? currentVariant.inventory_quantity : 0;
  const isOutOfStock = stock <= 0;

  const currentImage = images[selectedImageIndex]?.url || images[0]?.url || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85";

  const handleAddToCart = () => {
    setErrorMsg("");

    if (!selectedColor) {
      setErrorMsg("Please select a color.");
      return;
    }
    if (!selectedSize) {
      setErrorMsg("Please select a size.");
      return;
    }
    if (!currentVariant) {
      setErrorMsg("This combination is currently unavailable.");
      return;
    }
    if (stock < quantity) {
      setErrorMsg(`Only ${stock} units available in stock.`);
      return;
    }

    addItem({
      variantId: currentVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      size: currentVariant.size,
      color: currentVariant.color,
      sku: currentVariant.sku,
      unitPrice: product.price,
      quantity,
      maxInventory: stock,
      imageUrl: currentImage,
    });

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div className="bg-[#0a0a0b] min-h-screen py-8 sm:py-12 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-500 mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-white">Shop</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/categories/${product.category.slug}`} className="hover:text-white">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-[#ccff00] truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Image Gallery & Thumbnails */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[600px] flex-shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 bg-zinc-900 border overflow-hidden flex-shrink-0 transition-all ${
                      selectedImageIndex === idx
                        ? "border-[#ccff00] ring-1 ring-[#ccff00]"
                        : "border-zinc-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image with Zoom Button */}
            <div className="relative flex-1 aspect-[4/5] bg-zinc-950 border border-zinc-800 overflow-hidden group">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />

              <button
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-4 right-4 p-2.5 bg-black/80 hover:bg-[#ccff00] hover:text-black text-white border border-zinc-700 transition-colors"
                title="Enlarge Image"
                aria-label="Enlarge image"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {product.is_featured && (
                <div className="absolute top-4 left-4 bg-[#ccff00] text-black font-mono font-bold text-[10px] uppercase px-2.5 py-1">
                  Featured Drop
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Config & Buy Action */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Collection or Category Tag */}
              <div className="flex items-center gap-2">
                {product.collection && (
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#ccff00]">
                    {product.collection.name}
                  </span>
                )}
                {product.collection && product.category && <span>•</span>}
                {product.category && (
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    {product.category.name}
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <div>
                <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-baseline gap-3 mt-3">
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-[#ccff00]">
                    {formatBDT(product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="font-mono text-base text-zinc-500 line-through">
                      {formatBDT(product.compare_at_price)}
                    </span>
                  )}
                  <span className="text-[11px] font-mono uppercase text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5">
                    Cash On Delivery
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {product.description}
              </p>

              {/* Color Selector */}
              {availableColors.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex justify-between text-xs font-mono uppercase">
                    <span className="text-zinc-400">Color:</span>
                    <strong className="text-white">{selectedColor}</strong>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3.5 py-2 text-xs font-mono uppercase border transition-all ${
                          selectedColor === color
                            ? "border-[#ccff00] bg-zinc-900 text-white font-bold"
                            : "border-zinc-800 bg-[#121214] text-zinc-400 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector + Size Guide */}
              {availableSizes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex justify-between items-center text-xs font-mono uppercase">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">Size:</span>
                      <strong className="text-white">{selectedSize}</strong>
                    </div>
                    <SizeGuideModal />
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {availableSizes.map((size) => {
                      const v = variants.find(
                        (x) => x.color === selectedColor && x.size === size
                      );
                      const isVariantOut = !v || v.inventory_quantity <= 0;

                      return (
                        <button
                          key={size}
                          disabled={isVariantOut}
                          onClick={() => setSelectedSize(size)}
                          className={`py-3 text-xs font-mono uppercase border text-center transition-all ${
                            selectedSize === size
                              ? "border-[#ccff00] bg-[#ccff00] text-black font-bold"
                              : isVariantOut
                              ? "border-zinc-900 bg-zinc-950 text-zinc-600 cursor-not-allowed line-through"
                              : "border-zinc-800 bg-[#121214] text-zinc-300 hover:border-zinc-600 hover:text-white"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock Status Indicator */}
              <div className="pt-2">
                {currentVariant ? (
                  stock > 0 ? (
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
                      <span>
                        In Stock: <strong className="text-[#ccff00]">{stock} units</strong> remaining
                      </span>
                      <span className="text-zinc-500 font-mono text-[10px]">({currentVariant.sku})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-mono text-red-400">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Selected variant is currently Out of Stock</span>
                    </div>
                  )
                ) : (
                  <div className="text-xs font-mono text-zinc-500">
                    Select a color and size to check availability
                  </div>
                )}
              </div>

              {/* Quantity & Add to Cart Controls */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <div className="flex gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-zinc-800 bg-[#121214]">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="p-3 text-zinc-400 hover:text-white disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-xs font-mono font-bold text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                      disabled={quantity >= stock || isOutOfStock}
                      className="p-3 text-zinc-400 hover:text-white disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Bag Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || !currentVariant}
                    className="flex-1 h-12 bg-[#ccff00] hover:bg-[#b8e600] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {isOutOfStock
                        ? "Out of Stock"
                        : addedSuccess
                        ? "Added To Bag!"
                        : `Add to Bag • ${formatBDT(product.price * quantity)}`}
                    </span>
                  </button>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/60 text-xs font-mono text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Delivery & Value Propositions */}
              <div className="pt-6 border-t border-zinc-800/80 space-y-3 text-xs text-zinc-400">
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-[#ccff00] flex-shrink-0" />
                  <span>
                    <strong>Dhaka Delivery:</strong> ৳80 (24-48h) • <strong>Outside Dhaka:</strong> ৳150 (48-72h)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#ccff00] flex-shrink-0" />
                  <span>Pay Cash on Delivery only after checking package integrity.</span>
                </div>
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-[#ccff00] flex-shrink-0" />
                  <span>7-day easy size exchange guarantee.</span>
                </div>
              </div>

              {/* Fabric, Fit, and Care Info */}
              {product.details && (
                <div className="pt-6 border-t border-zinc-800">
                  <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white mb-2">
                    Fabric, Fit & Care
                  </h3>
                  <div className="text-xs text-zinc-400 whitespace-pre-line leading-relaxed font-mono">
                    {product.details}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 pt-16 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#ccff00]">
                  Complete The Fit
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
                  You Might Also Like
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-[#ccff00]"
              >
                View Catalog
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Enlarged Image Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-6 right-6 p-2 text-white hover:text-[#ccff00] z-10"
            aria-label="Close zoom"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={currentImage}
              alt={product.name}
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
