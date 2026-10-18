import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { getCustomerOrderByNumber, getOrderByNumberAndToken } from "@/lib/services/orders";
import { getAuthenticatedUser } from "@/lib/auth/server";
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
  const user = await getAuthenticatedUser();
  const userId = user?.id || "usr-demo";

  let order = await getCustomerOrderByNumber(orderNumber, userId);

  if (!order && token) {
    order = await getOrderByNumberAndToken(orderNumber, token);
  }

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#181818] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />
          <main className="flex-1 w-full">
            <OrderDetailClient order={order} />
          </main>
        </div>
      </div>
    </div>
  );
}
