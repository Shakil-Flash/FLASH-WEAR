"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics/ga4";
import { Order } from "@/lib/types";

interface Props {
  order: Order;
}

export function OrderConfirmationTracker({ order }: Props) {
  useEffect(() => {
    // Only track valid confirmed purchases (COD or confirmed paid online payment)
    if (order.payment_status === "paid" || order.payment_method === "cash_on_delivery") {
      const storageKey = `fw_purchase_tracked_${order.order_number}`;
      if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey)) {
        return;
      }

      trackPurchase({
        transactionId: order.order_number,
        items: order.items || [],
        value: order.total_amount,
        shipping: order.delivery_fee,
        coupon: order.coupon_code || undefined,
      });

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(storageKey, "1");
      }
    }
  }, [order]);

  return null;
}
