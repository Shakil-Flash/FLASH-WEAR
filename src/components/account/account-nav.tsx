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
      <div className="bg-white border border-[#E7E3DC] rounded-xl p-3 sm:p-5 shadow-sm md:sticky md:top-24">
        {/* User Card on desktop, compact on mobile */}
        <div className="hidden md:flex items-center gap-3 pb-4 mb-3 border-b border-[#E7E3DC]">
          <div className="w-10 h-10 rounded-full bg-[#181818] text-white flex items-center justify-center font-bold text-xs">
            FW
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-[#181818] truncate">FLASHWEAR Member</h3>
            <p className="text-xs text-[#74716D] truncate">Customer Account</p>
          </div>
        </div>

        {/* Navigation links: scrollable horizontal row on mobile, vertical stack on desktop */}
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-1 md:pb-0">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 sm:gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 md:shrink ${
                  isActive
                    ? "bg-[#181818] text-white shadow-xs"
                    : "text-[#74716D] hover:text-[#181818] hover:bg-[#F7F5F0]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <Link
            href="/account/login"
            className="hidden md:flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-3 border-t border-[#E7E3DC] pt-3"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Switch / Logout</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}
