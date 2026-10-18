import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { getCustomerOrderByNumber, getOrderByNumberAndToken } from "@/lib/services/orders";
import { OrderDetailClient } from "./order-detail-client";

interface Props {
  params: { orderNumber: string };
  searchParams: { token?: string };
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `Order ${params.orderNumber} | FLASHWEAR`,
  };
}

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { orderNumber } = params;
  const token = searchParams.token;
  const userId = "usr-demo"; // Active customer session

  // 1. Try customer-owned order first
  let order = await getCustomerOrderByNumber(orderNumber, userId);

  // 2. If not found or guest viewing with receipt token, verify token
  if (!order && token) {
    order = await getOrderByNumberAndToken(orderNumber, token);
  }

  // 3. Fallback: if order exists in demo/preview
  if (!order) {
    // Check if tokenless access is permitted for this session or 404
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          <AccountNav />
          <main className="flex-1">
            <OrderDetailClient order={order} />
          </main>
        </div>
      </div>
    </div>
  );
}
