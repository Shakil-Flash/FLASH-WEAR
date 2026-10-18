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
    return <div className="min-h-screen bg-[#070708] text-zinc-100">{children}</div>;
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0e0e11] border-b border-zinc-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-black text-white">
            FLASH<span className="text-[#ccff00]">ADMIN</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-400">
            PORTAL
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-zinc-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-[#0d0d10] border-r border-zinc-800/90 flex flex-col justify-between p-6 z-20 flex-shrink-0`}
      >
        <div className="space-y-8">
          {/* Admin Header */}
          <div>
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-mono text-lg font-black tracking-widest text-white">
                FLASH<span className="text-[#ccff00]">ADMIN</span>
              </span>
            </Link>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-1">
              Store Command Center
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider transition-all rounded-none ${
                    isActive
                      ? "bg-[#ccff00] text-black font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
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
        <div className="pt-6 border-t border-zinc-800 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between text-xs font-mono uppercase text-zinc-400 hover:text-white py-1.5"
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
            className="w-full flex items-center gap-2 text-xs font-mono uppercase text-red-400 hover:text-red-300 py-1.5 text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 p-6 md:p-10 overflow-x-hidden bg-[#0a0a0b]">{children}</main>
    </div>
  );
}
