"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Search, Menu, X, Shield, ArrowRight, User } from "lucide-react";
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
    { label: "Shop All", href: "/shop" },
    { label: "Hoodies", href: "/categories/hoodies-sweats" },
    { label: "Graphic Tees", href: "/categories/graphic-tees" },
    { label: "Cargo Pants", href: "/categories/cargo-pants" },
    { label: "Outerwear", href: "/categories/outerwear" },
    { label: "Collections", href: "/collections/drop-01-cyber-circuit" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0a0a0b]/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-zinc-300 hover:text-white"
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-zinc-300 hover:text-white"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-white group-hover:text-[#ccff00] transition-colors">
                FLASH<span className="text-[#ccff00]">WEAR</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800">
                BD
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs uppercase tracking-widest font-medium text-zinc-400 hover:text-[#ccff00] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              aria-label="Search products"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>

            {/* Customer Account Portal */}
            <Link
              href="/account"
              className="p-2 text-zinc-400 hover:text-[#ccff00] transition-colors"
              title="Customer Account"
              aria-label="Customer Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Admin entry point */}
            <Link
              href="/admin"
              className="p-2 text-zinc-400 hover:text-[#ccff00] transition-colors"
              title="Admin Portal"
            >
              <Shield className="w-5 h-5" />
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-zinc-300 hover:text-[#ccff00] transition-colors flex items-center gap-2"
              aria-label="View shopping cart"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {totalQuantity > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#ccff00] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalQuantity}
                  </span>
                )}
              </div>
              <span className="hidden md:inline-block font-mono text-xs uppercase font-medium">
                Cart
              </span>
            </button>
          </div>
        </div>

        {/* Expandable Search Input Bar */}
        {searchOpen && (
          <div className="border-t border-zinc-800 bg-[#121214] py-4 px-4 sm:px-6 animate-in slide-in-from-top duration-200">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by keyword (e.g., Hoodie, Oversized, Acid, Cargo)..."
                  className="w-full bg-[#18181b] border border-zinc-700 pl-12 pr-24 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ccff00]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-1.5 bg-[#ccff00] text-black text-xs font-semibold uppercase hover:bg-[#b8e600]"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-[#0a0a0b] border-r border-zinc-800 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
                <span className="font-mono text-xl font-black text-white">
                  FLASH<span className="text-[#ccff00]">WEAR</span>
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6 space-y-4">
                <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
                  Menu
                </p>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between text-sm uppercase tracking-wider font-medium text-zinc-200 hover:text-[#ccff00] py-2 border-b border-zinc-900"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800 space-y-3">
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs uppercase font-bold text-[#ccff00]"
              >
                My Account (Orders &amp; Returns)
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs uppercase text-zinc-400 hover:text-white"
              >
                About Brand
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs uppercase text-zinc-400 hover:text-white"
              >
                Support & Contact
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs uppercase text-[#ccff00]"
              >
                Admin Command Center
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
