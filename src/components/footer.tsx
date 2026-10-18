import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#F7F5F0] border-t border-[#E7E3DC] text-[#74716D] py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 pb-12 border-b border-[#E7E3DC]">
          {/* Brand info */}
          <div className="md:col-span-4 space-y-3">
            <Link href="/" className="inline-flex items-baseline gap-1">
              <span className="font-display text-xl font-bold tracking-tight text-[#181818]">
                FLASHWEAR
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5938]" />
            </Link>
            <p className="text-xs text-[#74716D] leading-relaxed max-w-sm">
              Contemporary streetwear and relaxed silhouettes engineered for everyday living. Heavyweight textiles, boxy cuts, and uncompromised comfort crafted in Dhaka, Bangladesh.
            </p>
            <div className="pt-1 text-xs text-[#181818] font-medium">
              Nationwide Cash on Delivery available across all 64 districts.
            </div>
          </div>

          {/* Catalog Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#181818]">
              Catalog
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/shop" className="hover:text-[#181818] transition-colors">
                  Shop All Products
                </Link>
              </li>
              <li>
                <Link href="/categories/hoodies-sweats" className="hover:text-[#181818] transition-colors">
                  Hoodies &amp; Sweats
                </Link>
              </li>
              <li>
                <Link href="/categories/graphic-tees" className="hover:text-[#181818] transition-colors">
                  Graphic Tees
                </Link>
              </li>
              <li>
                <Link href="/categories/cargo-pants" className="hover:text-[#181818] transition-colors">
                  Cargo &amp; Pants
                </Link>
              </li>
              <li>
                <Link href="/collections/drop-01-cyber-circuit" className="hover:text-[#181818] transition-colors">
                  Capsule Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#181818]">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/account" className="hover:text-[#181818] transition-colors">
                  My Account &amp; Order Status
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-[#181818] transition-colors">
                  Shipping &amp; Delivery Information
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-[#181818] transition-colors">
                  7-Day Size Exchange Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#181818] transition-colors">
                  Support &amp; WhatsApp
                </Link>
              </li>
            </ul>
          </div>

          {/* Brand & Legal */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#181818]">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-[#181818] transition-colors">
                  About FLASHWEAR
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-[#181818] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#181818] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-[#FF5938] transition-colors">
                  Staff Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#74716D]">
          <p>© {new Date().getFullYear()} FLASHWEAR. Crafted with pride in Dhaka.</p>
          <p className="flex items-center gap-3">
            <span>Cash on Delivery</span>
            <span>•</span>
            <span>SSLCOMMERZ Secure</span>
            <span>•</span>
            <span>Pathao Logistics</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
