import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrderById } from "@/lib/services/orders";
import { OrderDetailManager } from "@/components/admin/order-detail-manager";
import { ArrowLeft } from "lucide-react";

interface AdminOrderDetailPageProps {
  params: {
    id: string;
  };
}

export const revalidate = 0;

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const order = await getAdminOrderById(params.id);
  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-zinc-400 hover:text-white mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Orders</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Order: {order.order_number}
          </h1>
        </div>

        <div className="text-right font-mono text-xs text-zinc-500">
          Created: {new Date(order.created_at).toLocaleString("en-BD")}
        </div>
      </div>

      <OrderDetailManager order={order} />
    </div>
  );
}
