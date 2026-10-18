"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Search, Menu, X, User, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
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
    { label: "Shop All", href: "/shop" },
    { label: "Hoodies & Sweats", href: "/categories/hoodies-sweats" },
    { label: "Graphic Tees", href: "/categories/graphic-tees" },
    { label: "Cargo Pants", href: "/categories/cargo-pants" },
    { label: "Capsule Drop", href: "/collections/monochrome-core" },
    { label: "About", href: "/about" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F7F5F0]/95 backdrop-blur-md border-b border-[#E7E3DC] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#181818] hover:text-[#FF5938] transition-colors -ml-2"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#181818] hover:text-[#FF5938] transition-colors"
              aria-label="Search catalog"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center gap-8 xl:gap-12">
            <Link href="/" className="group flex items-baseline gap-1 py-1">
              <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-[#181818] transition-colors group-hover:text-[#FF5938]">
                FLASHWEAR
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5938] transition-transform group-hover:scale-125" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-[13px] font-medium py-1 relative transition-colors ${
                      isActive
                        ? "text-[#181818] font-semibold after:w-full"
                        : "text-[#74716D] hover:text-[#181818]"
                    } after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-[#FF5938] hover:after:w-full after:transition-all after:duration-200 ${
                      !isActive ? "after:w-0" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Desktop Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#74716D] hover:text-[#181818] rounded-md transition-colors"
              aria-label="Search products"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            {/* Customer Account Portal */}
            <Link
              href="/account"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#181818] hover:text-[#FF5938] transition-colors"
              title="Customer Account"
              aria-label="Customer Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-[#181818] hover:text-[#FF5938] transition-colors gap-1.5 px-2"
              aria-label="View shopping bag"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {totalQuantity > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FF5938] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-200">
                    {totalQuantity}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold ml-1">
                Bag
              </span>
            </button>
          </div>
        </div>

        {/* Minimalist Search Overlay */}
        {searchOpen && (
          <div className="border-t border-[#E7E3DC] bg-white py-4 px-4 sm:px-6 shadow-md animate-in slide-in-from-top-2 duration-150">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-[#74716D]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hoodies, tees, cargos, accessories..."
                  className="w-full bg-[#F7F5F0] border border-[#E7E3DC] rounded-lg pl-11 pr-24 py-2.5 text-sm text-[#181818] placeholder-[#74716D] focus:outline-none focus:border-[#FF5938] focus:bg-white focus:ring-2 focus:ring-[#FF5938]/15 transition-all"
                  autoFocus
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-1.5 text-[#74716D] hover:text-[#181818] rounded-md transition-colors"
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Clean Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-[#181818]/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-[#F7F5F0] border-r border-[#E7E3DC] h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-left duration-250">
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
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#74716D] hover:text-[#181818] rounded-lg transition-colors -mr-2"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search Bar inside Drawer */}
              <div className="pt-4 pb-2">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#74716D]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search collection..."
                    className="w-full bg-white border border-[#E7E3DC] rounded-lg pl-10 pr-4 py-2 text-xs text-[#181818] placeholder-[#74716D] focus:outline-none focus:border-[#FF5938]"
                  />
                </form>
              </div>

              <div className="py-4 space-y-1">
                <p className="text-[11px] font-semibold text-[#74716D] uppercase tracking-wider mb-2">
                  Navigation
                </p>
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`min-h-[44px] flex items-center justify-between text-base font-semibold px-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-white text-[#FF5938] font-bold shadow-xs border border-[#E7E3DC]"
                          : "text-[#181818] hover:text-[#FF5938] hover:bg-white/60"
                      }`}
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="w-4 h-4 text-[#74716D]/60" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-[#E7E3DC] space-y-2">
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#FF5938] bg-[#FFF5F3] border border-[#FF5938]/20 px-3 py-2 rounded-lg transition-colors"
              >
                <span>My Account &amp; Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="flex gap-4 pt-1">
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-medium text-[#74716D] hover:text-[#181818] py-1.5"
                >
                  About Us
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-medium text-[#74716D] hover:text-[#181818] py-1.5"
                >
                  Support
                </Link>
              </div>
              <div className="pt-2 text-[11px] text-[#74716D] leading-relaxed">
                Cash on Delivery available nationwide across all 64 districts in Bangladesh.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
