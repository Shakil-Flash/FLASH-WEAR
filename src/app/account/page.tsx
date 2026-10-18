import Link from "next/link";
import { AccountNav } from "@/components/account/account-nav";
import { getCustomerOrders } from "@/lib/services/orders";
import { getCustomerAddresses } from "@/lib/services/accounts";
import { formatBDT } from "@/lib/utils/format-currency";
import { Package, MapPin, ArrowRight, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen bg-[#F7F5F0] text-[#181818] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5938] mb-1">
            Member Account
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#181818]">
            Customer Overview
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <main className="flex-1 space-y-6 w-full">
            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-[#74716D] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Orders</span>
                  <Package className="w-4 h-4 text-[#FF5938]" />
                </div>
                <div className="text-2xl font-bold text-[#181818]">{orders.length}</div>
              </div>

              <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-[#74716D] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Saved Addresses</span>
                  <MapPin className="w-4 h-4 text-[#FF5938]" />
                </div>
                <div className="text-2xl font-bold text-[#181818]">{addresses.length}</div>
              </div>

              <div className="bg-white border border-[#E7E3DC] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-[#74716D] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Account Status</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xs text-emerald-700 font-semibold uppercase mt-2">Verified Member</div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E7E3DC]">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">Recent Orders</h2>
                  <p className="text-xs text-[#74716D] mt-0.5">Track shipments and view past order history</p>
                </div>
                <Link
                  href="/account/orders"
                  className="text-xs font-semibold text-[#FF5938] hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="text-center py-10 text-[#74716D]">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#181818]" />
                  <p className="text-sm font-medium text-[#181818]">No orders placed yet</p>
                  <p className="text-xs text-[#74716D] mt-1">Explore our latest drops and find your next fit.</p>
                  <Link
                    href="/shop"
                    className="inline-block mt-4 px-5 py-2.5 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#E7E3DC]">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-[#181818]">{order.order_number}</span>
                          <span className={`text-[11px] px-2 py-0.5 font-medium rounded-full ${
                            order.payment_status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {order.payment_status}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 font-medium rounded-full bg-[#F7F5F0] text-[#181818] border border-[#E7E3DC]">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#74716D]">
                          {new Date(order.created_at).toLocaleDateString()} &bull; {order.items?.length || 1} item(s) &bull; Total: <strong className="text-[#181818]">{formatBDT(order.total_amount)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/account/orders/${order.order_number}`}
                          className="px-3.5 py-1.5 bg-[#F7F5F0] hover:bg-white border border-[#E7E3DC] text-xs font-medium text-[#181818] rounded-lg transition-colors"
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
            <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E7E3DC]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">Default Shipping Address</h2>
                <Link
                  href="/account/addresses"
                  className="text-xs font-semibold text-[#FF5938] hover:underline"
                >
                  Manage Address Book &rarr;
                </Link>
              </div>

              {addresses.length > 0 ? (
                <div className="text-xs text-[#181818] space-y-1 leading-relaxed">
                  <p className="font-semibold text-sm">{addresses[0].full_name} <span className="text-xs font-normal text-[#74716D]">({addresses[0].label})</span></p>
                  <p>{addresses[0].address_line}</p>
                  <p>{addresses[0].district}, {addresses[0].division}</p>
                  <p className="text-[#74716D]">Phone: {addresses[0].phone}</p>
                </div>
              ) : (
                <p className="text-xs text-[#74716D]">No default address saved yet.</p>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
