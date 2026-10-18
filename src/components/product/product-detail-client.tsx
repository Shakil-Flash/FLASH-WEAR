"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatBDT } from "@/lib/utils/format-currency";
import { useCart } from "@/lib/cart-context";
import { SizeGuideModal } from "@/components/size-guide-modal";
import { ProductCard } from "@/components/product-card";
import { BackInStockModal } from "@/components/product/back-in-stock-modal";
import { trackViewItem, trackAddToCart } from "@/lib/analytics/ga4";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Plus,
  Minus,
  ZoomIn,
  X,
  Bell,
  TrendingDown,
  Check,
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
    () => Array.from(new Set(variants.map((v) => v.color).filter(Boolean))),
    [variants]
  );
  const availableSizes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size).filter(Boolean))),
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
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"back_in_stock" | "price_drop">("back_in_stock");

  // Find exact active variant
  const currentVariant = useMemo(() => {
    return variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );
  }, [variants, selectedColor, selectedSize]);

  const stock = currentVariant ? currentVariant.inventory_quantity : 0;
  const isOutOfStock = stock <= 0;

  React.useEffect(() => {
    trackViewItem(
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category?.name,
        item_variant: currentVariant?.sku,
      },
      product.price
    );
  }, [product, currentVariant]);

  const currentImage =
    images[selectedImageIndex]?.url ||
    images[0]?.url ||
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85";

  const handleAddToCart = () => {
    setErrorMsg("");

    if (!selectedColor && availableColors.length > 0) {
      setErrorMsg("Please select a color.");
      return;
    }
    if (!selectedSize && availableSizes.length > 0) {
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

    trackAddToCart(
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category?.name,
        item_variant: currentVariant.sku,
        quantity,
      },
      product.price * quantity
    );

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const hasDiscount = Boolean(product.compare_at_price && product.compare_at_price > product.price);

  return (
    <div className="bg-[#F7F5F0] min-h-screen py-8 sm:py-12 text-[#181818]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#74716D] mb-6 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#181818] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#181818] transition-colors">Shop</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/categories/${product.category.slug}`} className="hover:text-[#181818] transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-[#181818] font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Column: Image Gallery & Thumbnails (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:max-h-[640px] flex-shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 bg-[#F2EFEB] rounded border overflow-hidden flex-shrink-0 transition-all ${
                      selectedImageIndex === idx
                        ? "border-[#181818] ring-1 ring-[#181818]"
                        : "border-[#E7E3DC] opacity-70 hover:opacity-100"
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

            {/* Main Stage Image */}
            <div className="relative flex-1 aspect-[3/4] bg-[#F2EFEB] rounded-lg border border-[#E7E3DC] overflow-hidden group">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />

              <button
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-3.5 right-3.5 p-2 bg-white/90 hover:bg-white text-[#181818] rounded-md border border-[#E7E3DC] shadow-sm transition-colors"
                title="Enlarge image"
                aria-label="Enlarge image"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {product.is_featured && (
                <div className="absolute top-3.5 left-3.5 bg-[#181818] text-white text-[10px] font-semibold uppercase px-2.5 py-1 rounded-sm shadow-sm">
                  Featured
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Info & Purchase Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Category / Capsule Tag */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF5938]">
                  {product.category?.name || "Streetwear"}
                </span>

                {/* Title */}
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#181818] mt-1 leading-snug">
                  {product.name}
                </h1>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mt-3">
                  <span className="text-2xl sm:text-3xl font-bold text-[#181818]">
                    {formatBDT(product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-base text-[#74716D] line-through">
                      {formatBDT(product.compare_at_price)}
                    </span>
                  )}
                  <span className="text-xs text-[#74716D] bg-white border border-[#E7E3DC] px-2.5 py-0.5 rounded-sm">
                    Cash on Delivery
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[#74716D] leading-relaxed">
                {product.description}
              </p>

              {/* Color Selector */}
              {availableColors.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E7E3DC]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#74716D]">Color:</span>
                    <strong className="text-[#181818]">{selectedColor}</strong>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3.5 py-1.5 text-xs rounded-md border transition-all ${
                          selectedColor === color
                            ? "border-[#181818] bg-[#181818] text-white font-medium shadow-sm"
                            : "border-[#E7E3DC] bg-white text-[#74716D] hover:text-[#181818] hover:border-[#D5D0C7]"
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
                <div className="space-y-2 pt-2 border-t border-[#E7E3DC]">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#74716D]">Size:</span>
                      <strong className="text-[#181818]">{selectedSize}</strong>
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
                          className={`py-2.5 text-xs font-semibold rounded-md border text-center transition-all ${
                            selectedSize === size
                              ? "border-[#181818] bg-[#181818] text-white shadow-sm"
                              : isVariantOut
                              ? "border-[#E7E3DC] bg-[#F2EFEB] text-[#74716D]/50 cursor-not-allowed line-through"
                              : "border-[#E7E3DC] bg-white text-[#181818] hover:border-[#181818]"
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
              <div className="pt-1">
                {currentVariant ? (
                  stock > 0 ? (
                    <div className="flex items-center gap-2 text-xs text-[#74716D]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>
                        In stock ({stock} units remaining)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Selected variant is currently out of stock</span>
                    </div>
                  )
                ) : (
                  <div className="text-xs text-[#74716D]">
                    Select a color and size to check availability
                  </div>
                )}
              </div>

              {/* Quantity & Add to Cart Controls */}
              <div className="space-y-3 pt-3 border-t border-[#E7E3DC]">
                <div className="flex gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-[#E7E3DC] bg-white rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="p-3 text-[#74716D] hover:text-[#181818] disabled:opacity-30 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-[#181818]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                      disabled={quantity >= stock || isOutOfStock}
                      className="p-3 text-[#74716D] hover:text-[#181818] disabled:opacity-30 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Bag Button in Flash Orange */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || !currentVariant}
                    className="flex-1 h-12 bg-[#FF5938] hover:bg-[#E64525] disabled:bg-[#E7E3DC] disabled:text-[#74716D] disabled:cursor-not-allowed text-white font-semibold text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
                  >
                    {addedSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added To Bag</span>
                      </>
                    ) : isOutOfStock ? (
                      <span>Out of Stock</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Bag • {formatBDT(product.price * quantity)}</span>
                      </>
                    )}
                  </button>
                </div>

                {isOutOfStock && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalType("back_in_stock");
                      setStockModalOpen(true);
                    }}
                    className="w-full py-2.5 bg-white border border-[#E7E3DC] text-[#181818] hover:border-[#181818] text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#FF5938]" />
                    <span>Notify me when restocked</span>
                  </button>
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-xs font-medium text-red-600 rounded-md">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Natural reassurance points */}
              <div className="pt-4 border-t border-[#E7E3DC] space-y-2.5 text-xs text-[#74716D]">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-[#FF5938] flex-shrink-0" />
                  <span>
                    <strong>Dhaka Delivery:</strong> ৳80 (24-48h) • <strong>Outside Dhaka:</strong> ৳130 (48-72h)
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#FF5938] flex-shrink-0" />
                  <span>Cash on Delivery: Pay only after inspecting your parcel at doorstep.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 text-[#FF5938] flex-shrink-0" />
                  <span>7-day easy size exchange guarantee for unworn items.</span>
                </div>
              </div>

              {/* Details & Care Box */}
              {product.details && (
                <div className="pt-4 border-t border-[#E7E3DC]">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-[#181818] mb-2">
                    Fabric, Fit &amp; Care
                  </h3>
                  <div className="text-xs text-[#74716D] whitespace-pre-line leading-relaxed bg-white p-3.5 rounded-md border border-[#E7E3DC]">
                    {product.details}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* You Might Also Like */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#E7E3DC]">
            <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#E7E3DC]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF5938]">
                  Recommendations
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-[#181818] mt-0.5">
                  You might also like
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-xs font-semibold text-[#181818] hover:text-[#FF5938] transition-colors"
              >
                View Catalog
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.slice(0, 4).map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Enlarged Image Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-5 right-5 p-2 text-white hover:text-[#FF5938] z-10 transition-colors"
            aria-label="Close zoom"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={currentImage}
              alt={product.name}
              className="max-w-full max-h-[85vh] object-contain mx-auto rounded"
            />
          </div>
        </div>
      )}

      {/* Back In Stock & Price Drop Modal */}
      <BackInStockModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        productId={product.id}
        productName={product.name}
        variantId={currentVariant?.id}
        variantLabel={currentVariant ? `${currentVariant.color} / ${currentVariant.size}` : undefined}
        type={modalType}
        currentPrice={product.price}
      />
    </div>
  );
}
