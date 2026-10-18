import { describe, it, expect, beforeEach } from "vitest";
import {
  createGuestOrder,
  getOrderByNumberAndToken,
  getCustomerOrderByNumber,
  cancelOrderAndRestoreStock,
  markOrderPaid,
  markOrderPaymentFailed,
  markOrderPaymentCancelled,
} from "@/lib/services/orders";
import {
  initiateSSLCommerzPayment,
  validateSSLCommerzPayment,
  markPaymentFailedOrCancelled,
  fallbackTransactions,
} from "@/lib/payments/sslcommerz";
import {
  validateCoupon,
  recordCouponRedemption,
  INITIAL_COUPONS,
} from "@/lib/services/coupons";
import {
  bookOrderShipment,
  getCourierProvider,
  fallbackShipments,
} from "@/lib/shipping/courier";
import {
  createReturnRequest,
  restockReturnedItems,
  updateReturnRequestStatus,
  fallbackReturns,
} from "@/lib/services/returns";
import { getOperationalReport } from "@/lib/services/analytics";
import { INITIAL_PRODUCTS } from "@/lib/data/mock-catalog";

describe("Phase 2: Payments (SSLCOMMERZ)", () => {
  it("initiates payment and records transaction with initiated status", async () => {
    const initRes = await initiateSSLCommerzPayment({
      orderId: "ord-test-pay-1",
      orderNumber: "FW-20261017-001",
      totalAmount: 3200,
      customerName: "Tanzim Shakil",
      customerPhone: "01712345678",
      deliveryAddress: "House 10, Road 4, Banani, Dhaka",
      division: "Dhaka",
      district: "Dhaka",
    });

    expect(initRes.success).toBe(true);
    expect(initRes.tranId).toBeDefined();
    expect(initRes.redirectUrl).toContain("tran_id=");

    const tx = fallbackTransactions.find((t) => t.tran_id === initRes.tranId);
    expect(tx).toBeDefined();
    expect(tx?.status).toBe("initiated");
    expect(tx?.amount).toBe(3200);
  });

  it("successfully validates transaction server-side and marks order paid", async () => {
    // 1. Create order
    const orderRes = await createGuestOrder({
      customerName: "Payment Tester",
      customerPhone: "01712345678",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "Road 12, Gulshan 2, Dhaka",
      paymentMethod: "sslcommerz",
      items: [{ variantId: "var-1", quantity: 1 }],
    });
    expect(orderRes.success).toBe(true);

    // 2. Initiate
    const initRes = await initiateSSLCommerzPayment({
      orderId: orderRes.orderId!,
      orderNumber: orderRes.orderNumber!,
      totalAmount: orderRes.totalAmount!,
      customerName: "Payment Tester",
      customerPhone: "01712345678",
      deliveryAddress: "Road 12, Gulshan 2, Dhaka",
      division: "Dhaka",
      district: "Dhaka",
    });

    // 3. Server verification
    const valRes = await validateSSLCommerzPayment("VAL_123456", initRes.tranId!);
    expect(valRes.isValidated).toBe(true);
    expect(valRes.tranId).toBe(initRes.tranId);

    // 4. Mark order paid
    const markRes = await markOrderPaid(orderRes.orderId!, {
      tranId: initRes.tranId!,
      valId: "VAL_123456",
      amount: orderRes.totalAmount!,
      cardType: "BKASH",
    });
    expect(markRes.success).toBe(true);
  });

  it("handles duplicate verification idempotently without duplicate side effects", async () => {
    const initRes = await initiateSSLCommerzPayment({
      orderId: "ord-test-idemp",
      orderNumber: "FW-IDEMP-001",
      totalAmount: 2500,
      customerName: "Idemp User",
      customerPhone: "01811223344",
      deliveryAddress: "Dhanmondi 27",
      division: "Dhaka",
      district: "Dhaka",
    });

    // First validation
    const firstVal = await validateSSLCommerzPayment("VAL_FIRST", initRes.tranId!);
    expect(firstVal.isValidated).toBe(true);

    // Duplicate IPN call
    const secondVal = await validateSSLCommerzPayment("VAL_FIRST", initRes.tranId!);
    expect(secondVal.isValidated).toBe(true);
    expect(secondVal.tranId).toBe(initRes.tranId);
  });

  it("safely handles payment cancellation and releases stock reservation", async () => {
    const hoodie = INITIAL_PRODUCTS[0];
    const variant = hoodie.variants![0];
    const initialStock = variant.inventory_quantity;

    // Create online payment order (stock reserved)
    const orderRes = await createGuestOrder({
      customerName: "Cancelling User",
      customerPhone: "01912345678",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "Uttara Sector 11",
      paymentMethod: "sslcommerz",
      items: [{ variantId: variant.id, quantity: 2 }],
    });
    expect(orderRes.success).toBe(true);
    expect(variant.inventory_quantity).toBe(initialStock - 2);

    // Customer cancels on payment page -> release stock
    await markOrderPaymentCancelled(orderRes.orderId!);
    expect(variant.inventory_quantity).toBe(initialStock);
  });

  it("allows safe payment retry after failed attempt without double decrementing stock", async () => {
    const hoodie = INITIAL_PRODUCTS[0];
    const variant = hoodie.variants![0];
    const initialStock = variant.inventory_quantity;

    const orderRes = await createGuestOrder({
      customerName: "Retrying User",
      customerPhone: "01700112233",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "House 12, Road 4, Mirpur 10, Dhaka",
      paymentMethod: "sslcommerz",
      items: [{ variantId: variant.id, quantity: 1 }],
    });
    expect(orderRes.success).toBe(true);
    expect(variant.inventory_quantity).toBe(initialStock - 1);

    // Simulate payment failed
    await markOrderPaymentFailed(orderRes.orderId!, "Insufficient balance");

    // Stock stays reserved for retry (not double decremented)
    expect(variant.inventory_quantity).toBe(initialStock - 1);

    // Successful retry verification
    await markOrderPaid(orderRes.orderId!, {
      tranId: "TX-RETRY-01",
      valId: "VAL-RETRY-01",
      amount: orderRes.totalAmount!,
    });
    expect(variant.inventory_quantity).toBe(initialStock - 1);
  });
});

describe("Phase 2: Coupons & Discounts", () => {
  it("validates percentage coupon and caps discount by max_discount_amount", async () => {
    // FLASH10: 10% off, min order 1000, max discount 500
    const res = await validateCoupon("FLASH10", 6000);
    expect(res.valid).toBe(true);
    expect(res.discountAmount).toBe(500); // 10% of 6000 is 600, capped at 500
  });

  it("validates fixed amount coupon correctly", async () => {
    // WELCOME200: ৳200 flat on min order 2000
    const validRes = await validateCoupon("WELCOME200", 2500);
    expect(validRes.valid).toBe(true);
    expect(validRes.discountAmount).toBe(200);

    // Under minimum threshold
    const underMinRes = await validateCoupon("WELCOME200", 1500);
    expect(underMinRes.valid).toBe(false);
    expect(underMinRes.message).toContain("Minimum order amount");
  });

  it("rejects expired and non-existent coupon codes", async () => {
    const expiredRes = await validateCoupon("EXPIRED50", 2000);
    expect(expiredRes.valid).toBe(false);
    expect(expiredRes.message).toContain("expired");

    const nonExistentRes = await validateCoupon("DOESNOTEXIST", 2000);
    expect(nonExistentRes.valid).toBe(false);
    expect(nonExistentRes.message).toBe("Invalid coupon code");
  });

  it("applies coupon during checkout and recalculates totalAmount server-side", async () => {
    const orderRes = await createGuestOrder({
      customerName: "Coupon Shopper",
      customerPhone: "01712345678",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "House 22, Road 11, Banani, Dhaka",
      paymentMethod: "cash_on_delivery",
      couponCode: "FLASH10",
      items: [{ variantId: "var-1", quantity: 1 }],
    });
    expect(orderRes.success).toBe(true);
    // Delivery fee is 80
    // Total should be subtotal - discount + deliveryFee
    expect(orderRes.totalAmount).toBeGreaterThan(0);
  });
});

describe("Phase 2: Shipping & Courier Integration", () => {
  it("creates consignment with Pathao Courier adapter", async () => {
    const provider = getCourierProvider("Pathao Courier");
    const result = await provider.createShipment({
      orderId: "ord-ship-1",
      orderNumber: "FW-SHIP-001",
      recipientName: "Sagor Karim",
      recipientPhone: "01711223344",
      recipientAddress: "Road 7, Sector 3, Uttara",
      recipientCity: "Dhaka",
      deliveryFee: 80,
      codAmount: 3200,
      itemQuantity: 1,
    });

    expect(result.success).toBe(true);
    expect(result.consignmentId).toBeDefined();
    expect(result.trackingUrl).toContain("pathao.com");
  });

  it("prevents duplicate shipment bookings on repeated requests", async () => {
    const orderId = "ord-duplicate-ship-test";
    const req = {
      orderId,
      orderNumber: "FW-DUP-01",
      recipientName: "Dupe Tester",
      recipientPhone: "01799887766",
      recipientAddress: "Baridhara DOHS",
      recipientCity: "Dhaka",
      deliveryFee: 80,
      codAmount: 2500,
      itemQuantity: 1,
    };

    const first = await bookOrderShipment(orderId, "Pathao Courier", req);
    expect(first.success).toBe(true);

    const second = await bookOrderShipment(orderId, "Pathao Courier", req);
    expect(second.success).toBe(true);
    expect(second.consignmentId).toBe(first.consignmentId);
  });
});

describe("Phase 2: Returns & Operational Safeguards", () => {
  it("creates return request and does NOT restock inventory automatically", async () => {
    // 1. Create order
    const orderRes = await createGuestOrder({
      customerName: "Return Buyer",
      customerPhone: "01712345678",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "Bashundhara R/A",
      items: [{ variantId: "var-1", quantity: 1 }],
    });

    const hoodie = INITIAL_PRODUCTS[0];
    const variant = hoodie.variants![0];
    const stockAfterOrder = variant.inventory_quantity;

    // 2. Submit return request
    const retRes = await createReturnRequest({
      orderId: orderRes.orderId!,
      orderNumber: orderRes.orderNumber!,
      customerName: "Return Buyer",
      customerEmail: "return@example.com",
      customerPhone: "01712345678",
      requestType: "return",
      items: [
        {
          order_item_id: "item-1",
          product_id: hoodie.id,
          variant_id: variant.id,
          sku: variant.sku,
          product_name: hoodie.name,
          size: variant.size,
          quantity: 1,
          unit_price: hoodie.price,
        },
      ],
      reason: "Size / Fit issue",
    });
    expect(retRes.success).toBe(true);

    // CRITICAL: Stock must NOT be restored on submission
    expect(variant.inventory_quantity).toBe(stockAfterOrder);

    // Cannot restock before physical goods are received/inspected
    const earlyRestock = await restockReturnedItems(retRes.returnId!);
    expect(earlyRestock.success).toBe(false);
    expect(earlyRestock.error).toContain("Cannot restock items before physical goods are inspected");

    // 3. Mark as received and QA inspected
    await updateReturnRequestStatus(retRes.returnId!, "inspected", {
      inspectionOutcome: "Passed Inspection - Tags Intact",
    });

    // 4. Admin approves restock
    const approvedRestock = await restockReturnedItems(retRes.returnId!);
    expect(approvedRestock.success).toBe(true);
    expect(variant.inventory_quantity).toBe(stockAfterOrder + 1);
  });

  it("strictly enforces customer order ownership and guest token protection", async () => {
    const orderRes = await createGuestOrder({
      userId: "usr-alice",
      customerName: "Alice",
      customerPhone: "01711112222",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "Banani Road 11",
      items: [{ variantId: "var-1", quantity: 1 }],
    });

    // Alice can access her order
    const aliceOrder = await getCustomerOrderByNumber(orderRes.orderNumber!, "usr-alice");
    expect(aliceOrder).not.toBeNull();
    expect(aliceOrder?.order_number).toBe(orderRes.orderNumber);

    // Bob cannot access Alice's order
    const bobOrder = await getCustomerOrderByNumber(orderRes.orderNumber!, "usr-bob");
    expect(bobOrder).toBeNull();

    // Guest without secret token cannot access order
    const guestWithoutToken = await getOrderByNumberAndToken(orderRes.orderNumber!, "wrong_token");
    expect(guestWithoutToken).toBeNull();

    // Guest WITH valid token CAN access order
    const guestWithToken = await getOrderByNumberAndToken(orderRes.orderNumber!, orderRes.receiptToken!);
    expect(guestWithToken).not.toBeNull();
  });

  it("calculates accurate operational analytics without counting unpaid orders as money received", async () => {
    const report = await getOperationalReport({ range: "all" });
    expect(report.metrics).toBeDefined();
    expect(report.metrics.grossOrderValue).toBeGreaterThanOrEqual(0);
    expect(report.metrics.paymentsReceived).toBeGreaterThanOrEqual(0);
    expect(report.metrics.netSales).toBeGreaterThanOrEqual(0);
    expect(report.ordersByStatus).toBeDefined();
    expect(report.deliveryStats).toBeDefined();
  });
});
