import Link from "next/link";
import { AccountNav } from "@/components/account/account-nav";
import { getCustomerOrders } from "@/lib/services/orders";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { formatBDT } from "@/lib/utils/format-currency";
import { Package, ArrowRight } from "lucide-react";

export const metadata = {
  title: "My Orders | FLASHWEAR",
  description: "View your order history, delivery tracking, and request returns or exchanges.",
};

export default async function CustomerOrdersPage() {
  const user = await getAuthenticatedUser();
  const userId = user?.id || "usr-demo";
  const orders = await getCustomerOrders(userId);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#181818] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5938] mb-1">
            Purchase History
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#181818]">
            My Orders
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <main className="flex-1 w-full">
            <div className="bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
              <div className="mb-6 pb-4 border-b border-[#E7E3DC]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#181818]">
                  All Orders ({orders.length})
                </h2>
                <p className="text-xs text-[#74716D] mt-0.5">
                  Order status, courier consignment numbers, and item manifests
                </p>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-16 text-[#74716D]">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-40 text-[#181818]" />
                  <p className="text-sm font-medium text-[#181818]">You haven't placed any orders yet.</p>
                  <Link
                    href="/shop"
                    className="inline-block mt-4 px-5 py-2.5 bg-[#FF5938] hover:bg-[#E64525] text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Explore Collection
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-[#E7E3DC] rounded-xl bg-white p-5 hover:border-[#D1CCC2] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E3DC]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#181818]">
                              {order.order_number}
                            </span>
                            <span
                              className={`text-[11px] px-2.5 py-0.5 font-medium rounded-full ${
                                order.payment_status === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              Payment: {order.payment_status}
                            </span>
                            <span className="text-[11px] px-2.5 py-0.5 font-medium rounded-full bg-[#F7F5F0] text-[#181818] border border-[#E7E3DC]">
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#74716D] mt-1">
                            Placed on {new Date(order.created_at).toLocaleDateString()} &bull; Method:{" "}
                            <span className="capitalize">{order.payment_method.replace(/_/g, " ")}</span>
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-xs text-[#74716D]">Total Amount</div>
                          <div className="text-base font-bold text-[#FF5938]">
                            {formatBDT(order.total_amount)}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-xs text-[#181818]">
                          {order.items && order.items.length > 0 ? (
                            <p className="line-clamp-1">
                              {order.items.map((i) => `${i.product_name} (${i.size} x${i.quantity})`).join(", ")}
                            </p>
                          ) : (
                            <p>Streetwear order items</p>
                          )}
                          {order.courier_consignment_id && (
                            <p className="mt-1 text-[#74716D] text-[11px]">
                              Courier: <strong className="text-[#181818]">{order.courier_name}</strong> &bull; Consignment:{" "}
                              <strong className="text-[#FF5938]">{order.courier_consignment_id}</strong>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <Link
                            href={`/account/orders/${order.order_number}`}
                            className="px-4 py-2 bg-[#F7F5F0] hover:bg-[#181818] hover:text-white border border-[#E7E3DC] text-[#181818] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
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
