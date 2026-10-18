"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, MapPin, Heart, LogOut, Award, Share2 } from "lucide-react";

export function AccountNav() {
  const pathname = usePathname();

  const links = [
    { href: "/account", label: "Overview", icon: User },
    { href: "/account/orders", label: "My Orders", icon: Package },
    { href: "/account/rewards", label: "Loyalty & Rewards", icon: Award },
    { href: "/account/referrals", label: "Refer a Friend", icon: Share2 },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/account/wishlist", label: "Wishlist", icon: Heart },
    { href: "/account/profile", label: "Profile & Security", icon: User },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="bg-[#121214] border border-zinc-800 p-4 sticky top-28">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-zinc-800">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[#ccff00]">
            FW
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-white truncate">FLASHWEAR Member</h3>
            <p className="text-xs text-zinc-400 truncate">Customer Portal</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-[#ccff00] text-black font-bold"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <Link
            href="/account/login"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-red-400 hover:bg-zinc-900 transition-colors mt-4 border-t border-zinc-800/80 pt-3"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch / Logout</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}
