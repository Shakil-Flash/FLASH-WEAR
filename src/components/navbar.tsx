"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Search, Menu, X, User, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function Navbar() {
  const router = useRouter();
  const { totalQuantity, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { label: "Shop", href: "/shop" },
    { label: "Hoodies & Sweats", href: "/categories/hoodies-sweats" },
    { label: "Graphic Tees", href: "/categories/graphic-tees" },
    { label: "Cargo & Pants", href: "/categories/cargo-pants" },
    { label: "Collections", href: "/collections/drop-01-cyber-circuit" },
    { label: "About", href: "/about" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F7F5F0]/95 backdrop-blur-md border-b border-[#E7E3DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-[#181818] hover:text-[#FF5938] transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-[#181818] hover:text-[#FF5938] transition-colors"
              aria-label="Search catalog"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center gap-10">
            <Link href="/" className="group flex items-baseline gap-1 py-1">
              <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#181818] transition-colors group-hover:text-[#FF5938]">
                FLASHWEAR
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5938]" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-medium text-[#181818]/70 hover:text-[#181818] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#FF5938] hover:after:w-full after:transition-all after:duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Desktop Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs text-[#74716D] hover:text-[#181818] rounded-md transition-colors"
              aria-label="Search products"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            {/* Customer Account Portal */}
            <Link
              href="/account"
              className="p-2 text-[#181818] hover:text-[#FF5938] transition-colors"
              title="Customer Account"
              aria-label="Customer Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-[#181818] hover:text-[#FF5938] transition-colors flex items-center gap-2"
              aria-label="View shopping bag"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {totalQuantity > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FF5938] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {totalQuantity}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold">
                Bag
              </span>
            </button>
          </div>
        </div>

        {/* Minimalist Search Overlay */}
        {searchOpen && (
          <div className="border-t border-[#E7E3DC] bg-white py-4 px-4 sm:px-6 shadow-sm animate-in slide-in-from-top-1 duration-150">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-[#74716D]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hoodies, graphic tees, cargos, jackets..."
                  className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-md pl-11 pr-24 py-2.5 text-sm text-[#181818] placeholder-[#74716D] focus:outline-none focus:border-[#181818] focus:bg-white transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-3.5 py-1.5 bg-[#181818] hover:bg-[#FF5938] text-white text-xs font-semibold rounded transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Clean Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#181818]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-[#F7F5F0] border-r border-[#E7E3DC] h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-[#E7E3DC]">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-baseline gap-1">
                  <span className="font-display text-xl font-bold tracking-tight text-[#181818]">
                    FLASHWEAR
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5938]" />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#74716D] hover:text-[#181818] rounded-md transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6 space-y-2">
                <p className="text-[11px] font-semibold text-[#74716D] uppercase tracking-wider mb-3">
                  Shop Catalog
                </p>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between text-base font-semibold text-[#181818] hover:text-[#FF5938] py-2.5 transition-colors"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-[#74716D]/60" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-[#E7E3DC] space-y-3">
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#FF5938] py-1"
              >
                <span>My Account &amp; Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-[#74716D] hover:text-[#181818] py-1"
              >
                About FLASHWEAR
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-[#74716D] hover:text-[#181818] py-1"
              >
                Support &amp; WhatsApp
              </Link>
              <div className="pt-2 text-[11px] text-[#74716D]">
                Nationwide Cash on Delivery • Dhaka, BD
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
