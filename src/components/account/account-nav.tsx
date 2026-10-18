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
      <div className="bg-white border border-[#E7E3DC] rounded-xl p-4 sm:p-5 shadow-sm sticky top-24">
        <div className="flex items-center gap-3 pb-4 mb-3 border-b border-[#E7E3DC]">
          <div className="w-10 h-10 rounded-full bg-[#181818] text-white flex items-center justify-center font-bold text-xs">
            FW
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm font-bold text-[#181818] truncate">FLASHWEAR Member</h3>
            <p className="text-xs text-[#74716D] truncate">Customer Account</p>
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
                className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#181818] text-white"
                    : "text-[#74716D] hover:text-[#181818] hover:bg-[#F7F5F0]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <Link
            href="/account/login"
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-3 border-t border-[#E7E3DC] pt-3"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Switch / Logout</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}
