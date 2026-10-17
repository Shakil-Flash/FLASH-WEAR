import React from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Truck, RefreshCw, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#070708] border-t border-zinc-800 text-zinc-400">
      {/* Brand value propositions */}
      <div className="border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <Truck className="w-5 h-5 text-[#ccff00] mt-0.5" />
            <div>
              <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-white">
                Nationwide Delivery
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Fast courier delivery to all 64 districts in Bangladesh.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-5 h-5 text-[#ccff00] mt-0.5" />
            <div>
              <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-white">
                Cash on Delivery
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Inspect parcel and pay upon physical receipt at your doorstep.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <RefreshCw className="w-5 h-5 text-[#ccff00] mt-0.5" />
            <div>
              <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-white">
                7-Day Easy Exchange
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Hassle-free size replacement for unworn streetwear items.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Phone className="w-5 h-5 text-[#ccff00] mt-0.5" />
            <div>
              <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-white">
                Dedicated Support
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Direct WhatsApp and phone assistance: +880 1700-000000
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Brand identity column */}
        <div className="md:col-span-4 space-y-4">
          <span className="font-mono text-2xl font-black tracking-widest text-white">
            FLASH<span className="text-[#ccff00]">WEAR</span>
          </span>
          <p className="text-xs leading-relaxed text-zinc-400 max-w-sm">
            Contemporary streetwear and functional silhouettes engineered for urban culture.
            Crafted with heavyweight fabrics, sharp proportions, and uncompromised precision in Dhaka, Bangladesh.
          </p>
          <div className="pt-2">
            <span className="inline-block text-[11px] font-mono uppercase px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-[#ccff00]">
              Drop 01 // Live Now
            </span>
          </div>
        </div>

        {/* Catalog Links */}
        <div className="md:col-span-2 space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest font-bold text-white">
            Catalog
          </p>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/shop" className="hover:text-white transition-colors">
                All Streetwear
              </Link>
            </li>
            <li>
              <Link href="/categories/hoodies-sweats" className="hover:text-white transition-colors">
                Hoodies & Sweats
              </Link>
            </li>
            <li>
              <Link href="/categories/graphic-tees" className="hover:text-white transition-colors">
                Graphic Tees
              </Link>
            </li>
            <li>
              <Link href="/categories/cargo-pants" className="hover:text-white transition-colors">
                Cargo Pants
              </Link>
            </li>
            <li>
              <Link href="/categories/outerwear" className="hover:text-white transition-colors">
                Jackets & Outerwear
              </Link>
            </li>
          </ul>
        </div>

        {/* Company Links */}
        <div className="md:col-span-3 space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest font-bold text-white">
            Company & Policies
          </p>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/about" className="hover:text-white transition-colors">
                About FLASHWEAR
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="hover:text-white transition-colors">
                Shipping & Delivery (BD)
              </Link>
            </li>
            <li>
              <Link href="/return-policy" className="hover:text-white transition-colors">
                Return & Exchange Policy
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact & Store Location */}
        <div className="md:col-span-3 space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest font-bold text-white">
            Headquarters
          </p>
          <div className="text-xs space-y-2 text-zinc-400">
            <p>Banani, Block C, Road 11</p>
            <p>Dhaka 1213, Bangladesh</p>
            <p className="pt-2 text-zinc-200 font-mono">support@flashwear.store</p>
            <p className="text-zinc-200 font-mono">+880 1700-000000</p>
            <p className="text-[11px] text-zinc-500 pt-2">Hours: 10:00 AM – 10:00 PM (Everyday)</p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-900 bg-black/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>&copy; {new Date().getFullYear()} FLASHWEAR Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-zinc-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-300">
              Terms
            </Link>
            <Link href="/admin" className="text-zinc-600 hover:text-[#ccff00] font-mono text-[11px]">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
