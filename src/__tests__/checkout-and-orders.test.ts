import { describe, it, expect, beforeEach } from "vitest";
import { formatBDT, calculateDeliveryFee } from "@/lib/utils/format-currency";
import {
  checkoutSchema,
  createGuestOrder,
  getOrderByNumberAndToken,
  cancelOrderAndRestoreStock,
} from "@/lib/services/orders";
import { INITIAL_PRODUCTS } from "@/lib/data/mock-catalog";

describe("1. Currency & Delivery Fee Rules", () => {
  it("formats Bangladeshi Taka correctly with symbol", () => {
    expect(formatBDT(3450)).toBe("৳3,450");
    expect(formatBDT(0)).toBe("৳0");
    expect(formatBDT(150.5)).toBe("৳151");
    expect(formatBDT(null)).toBe("৳0");
  });

  it("calculates correct delivery fee for Dhaka vs Outside Dhaka", () => {
    expect(calculateDeliveryFee("Dhaka")).toBe(80);
    expect(calculateDeliveryFee("dhaka")).toBe(80);
    expect(calculateDeliveryFee("Chattogram")).toBe(150);
    expect(calculateDeliveryFee("Sylhet")).toBe(150);
    expect(calculateDeliveryFee("Rajshahi")).toBe(150);
  });
});

describe("2. Checkout Validation Schema (Bangladesh Focused)", () => {
  it("accepts valid Bangladesh phone numbers", () => {
    const validInputs = ["01712345678", "01811223344", "+8801912345678", "01300000000"];
    for (const phone of validInputs) {
      const res = checkoutSchema.safeParse({
        customerName: "Rahim Uddin",
        customerPhone: phone,
        division: "Dhaka",
        district: "Dhaka",
        deliveryAddress: "House 12, Road 4, Sector 7, Uttara",
        items: [{ variantId: "var-1", quantity: 1 }],
      });
      expect(res.success).toBe(true);
    }
  });

  it("rejects invalid phone numbers", () => {
    const invalidInputs = ["12345", "01234567890", "017abcdefgh", "1712345678"];
    for (const phone of invalidInputs) {
      const res = checkoutSchema.safeParse({
        customerName: "Rahim Uddin",
        customerPhone: phone,
        division: "Dhaka",
        district: "Dhaka",
        deliveryAddress: "House 12, Road 4, Sector 7, Uttara",
        items: [{ variantId: "var-1", quantity: 1 }],
      });
      expect(res.success).toBe(false);
    }
  });

  it("rejects missing delivery address or empty items", () => {
    const emptyItemsRes = checkoutSchema.safeParse({
      customerName: "Rahim",
      customerPhone: "01712345678",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "Valid street address 123",
      items: [],
    });
    expect(emptyItemsRes.success).toBe(false);

    const shortAddressRes = checkoutSchema.safeParse({
      customerName: "Rahim",
      customerPhone: "01712345678",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "Dhaka",
      items: [{ variantId: "var-1", quantity: 1 }],
    });
    expect(shortAddressRes.success).toBe(false);
  });
});

describe("3. Order Creation & Inventory Operations", () => {
  it("creates a Cash on Delivery order and decrements variant stock safely", async () => {
    // Find var-1
    const hoodie = INITIAL_PRODUCTS.find((p) => p.slug === "flash-matrix-oversized-hoodie");
    const variant = hoodie?.variants?.find((v) => v.id === "var-1");
    expect(variant).toBeDefined();

    const initialStock = variant!.inventory_quantity;
    expect(initialStock).toBeGreaterThan(2);

    const orderResult = await createGuestOrder({
      customerName: "Samiul Karim",
      customerPhone: "01712345678",
      customerEmail: "samiul@example.com",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "Flat 4A, Road 27, Banani, Dhaka 1213",
      orderNotes: "Call before dispatch",
      items: [{ variantId: "var-1", quantity: 2 }],
    });

    expect(orderResult.success).toBe(true);
    expect(orderResult.orderNumber).toMatch(/^FW-\d{8}-[A-F0-9]{6}$/);
    expect(orderResult.receiptToken).toBeDefined();

    // Verify stock was decremented by 2
    expect(variant!.inventory_quantity).toBe(initialStock - 2);
  });

  it("prevents overselling when requested quantity exceeds available stock", async () => {
    // Pick var-18 with low stock
    const jacket = INITIAL_PRODUCTS.find((p) => p.slug === "stealth-windbreaker-jacket");
    const variant = jacket?.variants?.find((v) => v.id === "var-18");
    expect(variant).toBeDefined();

    const currentStock = variant!.inventory_quantity;

    // Attempt to order currentStock + 10 units
    const orderResult = await createGuestOrder({
      customerName: "Nafis Ahmed",
      customerPhone: "01811223344",
      division: "Chattogram",
      district: "Chittagong",
      deliveryAddress: "GEC Circle, Nasirabad, Chittagong",
      items: [{ variantId: "var-18", quantity: currentStock + 10 }],
    });

    // Zod max 10 or service logic rejection
    expect(orderResult.success).toBe(false);
    expect(orderResult.error).toBeDefined();
    // Stock remains untouched
    expect(variant!.inventory_quantity).toBe(currentStock);
  });

  it("protects private order details: requires matching receipt token", async () => {
    const orderResult = await createGuestOrder({
      customerName: "Tanvir Hasan",
      customerPhone: "01911223344",
      division: "Sylhet",
      district: "Sylhet",
      deliveryAddress: "Zindabazar, Amberkhana Road, Sylhet",
      items: [{ variantId: "var-6", quantity: 1 }],
    });

    expect(orderResult.success).toBe(true);

    // 1. Authorized lookup with valid receipt token
    const authorized = await getOrderByNumberAndToken(
      orderResult.orderNumber!,
      orderResult.receiptToken!
    );
    expect(authorized).not.toBeNull();
    expect(authorized?.customer_name).toBe("Tanvir Hasan");

    // 2. Unauthorized snooping with forged token fails
    const unauthorized = await getOrderByNumberAndToken(
      orderResult.orderNumber!,
      "fake-forged-token-12345"
    );
    expect(unauthorized).toBeNull();
  });

  it("cancels an order and safely restores variant stock back to warehouse", async () => {
    const tee = INITIAL_PRODUCTS.find((p) => p.slug === "cyber-acid-graphic-tee");
    const variant = tee?.variants?.find((v) => v.id === "var-7");
    expect(variant).toBeDefined();

    const stockBefore = variant!.inventory_quantity;

    // Place order for 2 units
    const orderResult = await createGuestOrder({
      customerName: "Asif Iqbal",
      customerPhone: "01799887766",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "Mirpur 10, Block C, Section 6",
      items: [{ variantId: "var-7", quantity: 2 }],
    });

    expect(orderResult.success).toBe(true);
    expect(variant!.inventory_quantity).toBe(stockBefore - 2);

    // Cancel order & restore stock
    const cancelRes = await cancelOrderAndRestoreStock(orderResult.orderId!, "Customer requested cancellation");
    expect(cancelRes.success).toBe(true);

    // Verify stock is restored
    expect(variant!.inventory_quantity).toBe(stockBefore);
  });

  it("handles idempotency: repeated submissions return existing order without double deducting stock", async () => {
    const idempKey = "test_idemp_key_unique_8829";
    const bag = INITIAL_PRODUCTS.find((p) => p.slug === "vektor-modular-crossbody-bag");
    const variant = bag?.variants?.find((v) => v.id === "var-24");
    expect(variant).toBeDefined();

    const stockBefore = variant!.inventory_quantity;

    // First submit
    const res1 = await createGuestOrder({
      customerName: "Farhan Ali",
      customerPhone: "01722334455",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "Dhanmondi 27, House 5, Road 8",
      idempotencyKey: idempKey,
      items: [{ variantId: "var-24", quantity: 1 }],
    });
    expect(res1.success).toBe(true);
    expect(res1.isDuplicate).toBe(false);
    expect(variant!.inventory_quantity).toBe(stockBefore - 1);

    // Second accidental duplicate submit with same idempotencyKey
    const res2 = await createGuestOrder({
      customerName: "Farhan Ali",
      customerPhone: "01722334455",
      division: "Dhaka",
      district: "Dhaka",
      deliveryAddress: "Dhanmondi 27, House 5, Road 8",
      idempotencyKey: idempKey,
      items: [{ variantId: "var-24", quantity: 1 }],
    });
    expect(res2.success).toBe(true);
    expect(res2.isDuplicate).toBe(true);
    expect(res2.orderNumber).toBe(res1.orderNumber);
    // Stock must NOT be deducted again!
    expect(variant!.inventory_quantity).toBe(stockBefore - 1);
  });
});
