"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  FolderTree,
  ShoppingCart,
  Boxes,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  RotateCcw,
  Tag,
  BarChart3,
  Award,
  Share2,
  Mail,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If on admin login page, render clean layout without sidebar
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[#F7F5F0] text-[#181818]">{children}</div>;
  }

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { label: "Returns", href: "/admin/returns", icon: RotateCcw },
    { label: "Loyalty", href: "/admin/loyalty", icon: Award },
    { label: "Referrals", href: "/admin/referrals", icon: Share2 },
    { label: "Marketing", href: "/admin/marketing", icon: Mail },
    { label: "Discounts", href: "/admin/discounts", icon: Tag },
    { label: "Reports & Funnel", href: "/admin/reports", icon: BarChart3 },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Collections", href: "/admin/collections", icon: Layers },
    { label: "Inventory", href: "/admin/inventory", icon: Boxes },
    { label: "Operations & Health", href: "/admin/operations", icon: Shield },
    { label: "Store Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#181818] flex flex-col md:flex-row font-sans">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#E7E3DC] sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold tracking-tight text-[#181818]">
            FLASHWEAR<span className="text-[#FF5938]">.</span>
          </span>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-[#F7F5F0] border border-[#E7E3DC] text-[#74716D] rounded">
            Admin
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-[#74716D] hover:text-[#181818]"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-white border-r border-[#E7E3DC] flex flex-col justify-between p-6 z-20 flex-shrink-0`}
      >
        <div className="space-y-6">
          {/* Admin Header */}
          <div>
            <Link href="/admin" className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-[#181818]">
                FLASHWEAR<span className="text-[#FF5938]">.</span>
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-[#F7F5F0] border border-[#E7E3DC] text-[#74716D] rounded">
                Admin
              </span>
            </Link>
            <p className="text-[11px] text-[#74716D] mt-1">
              Store Operations Dashboard
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#181818] text-white font-semibold"
                      : "text-[#74716D] hover:text-[#181818] hover:bg-[#F7F5F0]"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-[#E7E3DC] space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between text-xs font-medium text-[#74716D] hover:text-[#181818] py-1.5"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={async () => {
              try {
                await fetch("/api/admin/auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "logout" }),
                });
              } catch {}
              localStorage.removeItem("flashwear_admin_auth");
              router.push("/admin/login");
            }}
            className="w-full flex items-center gap-2 text-xs font-medium text-red-600 hover:text-red-700 py-1.5 text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 p-6 md:p-10 overflow-x-hidden bg-[#F7F5F0] text-[#181818]">{children}</main>
    </div>
  );
}
