// Official GA4 Ecommerce Event Implementations
// Documentation: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce

export interface GA4Item {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  currency?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Memory set to prevent duplicate client-side purchase events
const sentPurchases = new Set<string>();

/**
 * Safe wrapper to send GA4 events if gtag exists
 */
export function sendGA4Event(eventName: string, params: Record<string, any>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    // In dev or when GA is not loaded, we can log in debug mode
    if (process.env.NODE_ENV === "development") {
      console.debug(`[GA4 Event] ${eventName}:`, params);
    }
    return;
  }

  window.gtag("event", eventName, params);
}

/**
 * Helper to normalize any CartItem or product variant into GA4 item format
 */
export function normalizeGA4Item(item: any, idx?: number): GA4Item {
  return {
    item_id: item.sku || item.variantId || item.variant_id || item.productId || item.product_id || item.id || item.item_id || "item",
    item_name: item.productName || item.product_name || item.name || item.item_name || "Streetwear Item",
    item_brand: "FLASHWEAR",
    item_category: item.category || "Streetwear",
    item_variant: item.size && item.color ? `${item.size} / ${item.color}` : item.size || item.color || item.item_variant,
    price: item.unitPrice ?? item.unit_price ?? item.price ?? 0,
    quantity: item.quantity ?? 1,
    currency: "BDT",
    index: idx !== undefined ? idx + 1 : undefined,
  };
}

/**
 * 1. view_item_list: When user views product catalog or category
 */
export function trackViewItemList(listName: string, items: any[]) {
  sendGA4Event("view_item_list", {
    item_list_name: listName,
    items: items.map((item, idx) => normalizeGA4Item(item, idx)),
  });
}

/**
 * 2. select_item: When user clicks a product in a list
 */
export function trackSelectItem(listName: string, item: any) {
  sendGA4Event("select_item", {
    item_list_name: listName,
    items: [normalizeGA4Item(item)],
  });
}

/**
 * 3. view_item: When user views a product detail page
 */
export function trackViewItem(item: any, value: number) {
  sendGA4Event("view_item", {
    currency: "BDT",
    value,
    items: [normalizeGA4Item(item)],
  });
}

/**
 * 4. add_to_cart: When item added to cart
 */
export function trackAddToCart(item: any, value: number) {
  sendGA4Event("add_to_cart", {
    currency: "BDT",
    value,
    items: [normalizeGA4Item(item)],
  });
}

/**
 * 5. view_cart: When user opens or views the shopping cart
 */
export function trackViewCart(items: any[], value: number) {
  sendGA4Event("view_cart", {
    currency: "BDT",
    value,
    items: items.map((i, idx) => normalizeGA4Item(i, idx)),
  });
}

/**
 * 6. remove_from_cart: When item removed from cart
 */
export function trackRemoveFromCart(item: any, value: number) {
  sendGA4Event("remove_from_cart", {
    currency: "BDT",
    value,
    items: [normalizeGA4Item(item)],
  });
}

/**
 * 7. apply_coupon: When user validates a promotional coupon
 */
export function trackApplyCoupon(couponCode: string, discountAmount: number) {
  sendGA4Event("apply_coupon", {
    coupon: couponCode,
    discount: discountAmount,
    currency: "BDT",
  });
}

/**
 * 8. begin_checkout: When checkout page opened
 */
export function trackBeginCheckout(items: any[], value: number, coupon?: string) {
  sendGA4Event("begin_checkout", {
    currency: "BDT",
    value,
    coupon: coupon || undefined,
    items: items.map((i, idx) => normalizeGA4Item(i, idx)),
  });
}

/**
 * 9. add_payment_info: When user selects payment method
 */
export function trackAddPaymentInfo(paymentType: string, value: number, items: any[]) {
  sendGA4Event("add_payment_info", {
    currency: "BDT",
    value,
    payment_type: paymentType,
    items: items.map((i, idx) => normalizeGA4Item(i, idx)),
  });
}

/**
 * 10. purchase: When order is placed / payment is confirmed
 * Includes strict client-side deduplication using order/transaction ID
 */
export function trackPurchase(
  orderOrData:
    | {
        transactionId: string;
        value: number;
        shipping: number;
        coupon?: string;
        items: any[];
      }
    | string,
  itemsArg?: any[],
  totalAmountArg?: number,
  shippingArg?: number,
  discountArg?: number,
  couponArg?: string
) {
  const transactionId = typeof orderOrData === "string" ? orderOrData : orderOrData.transactionId;
  const value = typeof orderOrData === "string" ? (totalAmountArg || 0) : orderOrData.value;
  const shipping = typeof orderOrData === "string" ? (shippingArg || 0) : orderOrData.shipping;
  const coupon = typeof orderOrData === "string" ? couponArg : orderOrData.coupon;
  const rawItems = typeof orderOrData === "string" ? (itemsArg || []) : orderOrData.items;

  if (sentPurchases.has(transactionId)) {
    return; // Already sent, prevent duplicate reporting
  }

  sentPurchases.add(transactionId);

  sendGA4Event("purchase", {
    transaction_id: transactionId,
    value,
    currency: "BDT",
    tax: 0,
    shipping,
    coupon: coupon || undefined,
    items: rawItems.map((i, idx) => normalizeGA4Item(i, idx)),
  });
}

/**
 * 11. refund: When order is refunded
 */
export function trackRefund(transactionId: string, value: number, items?: any[]) {
  sendGA4Event("refund", {
    transaction_id: transactionId,
    value,
    currency: "BDT",
    items: items?.map((i, idx) => normalizeGA4Item(i, idx)),
  });
}

/**
 * 12. add_to_wishlist
 */
export function trackAddToWishlist(item: any) {
  sendGA4Event("add_to_wishlist", {
    currency: "BDT",
    value: item.price || 0,
    items: [normalizeGA4Item(item)],
  });
}
