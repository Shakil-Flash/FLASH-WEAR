import Link from "next/link";
import { AccountNav } from "@/components/account/account-nav";
import { getCustomerOrders } from "@/lib/services/orders";
import { getCustomerAddresses } from "@/lib/services/accounts";
import { formatBDT } from "@/lib/utils/format-currency";
import { Package, MapPin, ArrowRight, ShieldCheck, Clock } from "lucide-react";

export const metadata = {
  title: "Account Overview | FLASHWEAR",
  description: "Manage your FLASHWEAR account, orders, delivery addresses, and wishlist.",
};

export default async function AccountPage() {
  const userId = "usr-demo";
  const orders = await getCustomerOrders(userId);
  const addresses = await getCustomerAddresses(userId);
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#ccff00] font-mono mb-1">
            {"// MEMBER PORTAL"}
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Customer Dashboard
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <AccountNav />

          <main className="flex-1 space-y-8">
            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#121214] border border-zinc-800 p-5">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                  <Package className="w-4 h-4 text-[#ccff00]" />
                </div>
                <div className="text-2xl font-black font-mono">{orders.length}</div>
              </div>

              <div className="bg-[#121214] border border-zinc-800 p-5">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Saved Addresses</span>
                  <MapPin className="w-4 h-4 text-[#ccff00]" />
                </div>
                <div className="text-2xl font-black font-mono">{addresses.length}</div>
              </div>

              <div className="bg-[#121214] border border-zinc-800 p-5">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Member Security</span>
                  <ShieldCheck className="w-4 h-4 text-[#ccff00]" />
                </div>
                <div className="text-xs text-emerald-400 font-bold uppercase mt-2">Verified Session</div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-[#121214] border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-white">Recent Orders</h2>
                  <p className="text-xs text-zinc-400">Track shipments and view past order invoices</p>
                </div>
                <Link
                  href="/account/orders"
                  className="text-xs font-bold uppercase text-[#ccff00] hover:underline flex items-center gap-1"
                >
                  View All Orders <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No orders placed yet.</p>
                  <Link
                    href="/shop"
                    className="inline-block mt-4 px-4 py-2 bg-[#ccff00] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#b8e600]"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/80">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-bold text-white">{order.order_number}</span>
                          <span className={`text-[10px] px-2 py-0.5 uppercase font-bold ${
                            order.payment_status === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}>
                            {order.payment_status}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 uppercase font-bold bg-zinc-800 text-zinc-300">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          {new Date(order.created_at).toLocaleDateString()} &bull; {order.items?.length || 1} item(s) &bull; Total: <strong className="text-white">{formatBDT(order.total_amount)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/account/orders/${order.order_number}`}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold uppercase tracking-wider text-white transition-colors"
                        >
                          Details &amp; Tracking
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Default Address Section */}
            <div className="bg-[#121214] border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
                <h2 className="text-base font-bold uppercase tracking-wider text-white">Default Shipping Address</h2>
                <Link
                  href="/account/addresses"
                  className="text-xs font-bold uppercase text-[#ccff00] hover:underline"
                >
                  Manage Address Book &rarr;
                </Link>
              </div>

              {addresses.length > 0 ? (
                <div className="text-sm text-zinc-300 space-y-1">
                  <p className="font-bold text-white">{addresses[0].full_name} <span className="text-xs font-normal text-zinc-500">({addresses[0].label})</span></p>
                  <p>{addresses[0].address_line}</p>
                  <p>{addresses[0].district}, {addresses[0].division}</p>
                  <p className="text-xs text-zinc-400 font-mono">Phone: {addresses[0].phone}</p>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">No default address saved yet.</p>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
