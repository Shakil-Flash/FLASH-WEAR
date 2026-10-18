import Link from "next/link";
import { AccountNav } from "@/components/account/account-nav";
import { getCustomerOrders } from "@/lib/services/orders";
import { formatBDT } from "@/lib/utils/format-currency";
import { Package, ExternalLink, ArrowRight } from "lucide-react";

export const metadata = {
  title: "My Orders | FLASHWEAR",
  description: "View your order history, delivery tracking, and request returns or exchanges.",
};

export default async function CustomerOrdersPage() {
  const userId = "usr-demo";
  const orders = await getCustomerOrders(userId);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#ccff00] font-mono mb-1">
            {"// PURCHASE HISTORY"}
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            My Orders
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <AccountNav />

          <main className="flex-1">
            <div className="bg-[#121214] border border-zinc-800 p-6">
              <div className="mb-6 pb-4 border-b border-zinc-800">
                <h2 className="text-base font-bold uppercase tracking-wider text-white">All Orders ({orders.length})</h2>
                <p className="text-xs text-zinc-400">Order verification, courier tracking numbers, and receipt links</p>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">You haven't placed any orders yet.</p>
                  <Link
                    href="/shop"
                    className="inline-block mt-4 px-5 py-2.5 bg-[#ccff00] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#b8e600]"
                  >
                    Explore Streetwear Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-zinc-800 bg-[#161619] p-5 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-base font-bold text-white">
                              {order.order_number}
                            </span>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 uppercase font-bold ${
                                order.payment_status === "paid"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              Payment: {order.payment_status}
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 uppercase font-bold bg-zinc-800 text-zinc-300">
                              Fulfillment: {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">
                            Placed on {new Date(order.created_at).toLocaleDateString()} &bull; Method:{" "}
                            <span className="capitalize">{order.payment_method.replace(/_/g, " ")}</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-zinc-400">Total Amount</div>
                          <div className="text-lg font-black font-mono text-[#ccff00]">
                            {formatBDT(order.total_amount)}
                          </div>
                        </div>
                      </div>

                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-xs text-zinc-300">
                          {order.items && order.items.length > 0 ? (
                            <p>
                              {order.items.map((i) => `${i.product_name} (${i.size} x${i.quantity})`).join(", ")}
                            </p>
                          ) : (
                            <p>Streetwear order items</p>
                          )}
                          {order.courier_consignment_id && (
                            <p className="mt-1 text-zinc-400 font-mono text-[11px]">
                              Courier: <strong className="text-white">{order.courier_name}</strong> &bull; Consignment:{" "}
                              <strong className="text-[#ccff00]">{order.courier_consignment_id}</strong>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <Link
                            href={`/account/orders/${order.order_number}`}
                            className="px-4 py-2 bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                          >
                            <span>Manage &amp; Track</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
