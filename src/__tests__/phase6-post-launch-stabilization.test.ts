import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGuestOrder,
  updateAdminOrderStatus,
  getOrderByNumberAndToken,
  getCustomerOrders,
  getCustomerOrderByNumber,
  getOrderById,
} from "@/lib/services/orders";
import { PATCH as adminOrdersPatch } from "@/app/api/admin/orders/route";
import { PATCH as adminInventoryPatch, GET as adminInventoryGet } from "@/app/api/admin/inventory/route";
import { fallbackStockAudits } from "@/lib/services/inventory";
import { INITIAL_PRODUCTS } from "@/lib/data/mock-catalog";

describe("Phase 6: Post-Launch Stabilization & Operational Quality", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Order Support & Independent Admin Notes Update", () => {
    it("allows updating admin internal notes and tracking number without changing order status", async () => {
      const orderRes = await createGuestOrder({
        customerName: "Stabilization Tester",
        customerPhone: "01711223344",
        customerEmail: "tester@flashwear.store",
        deliveryAddress: "Banani Road 11",
        division: "Dhaka",
        district: "Dhaka",
        paymentMethod: "cash_on_delivery",
        items: [{ variantId: "var-1", quantity: 1 }],
      });

      expect(orderRes.success).toBe(true);
      const orderId = orderRes.orderId!;

      // Initial status is pending
      const initial = await getOrderById(orderId);
      expect(initial?.status).toBe("pending");
      expect(initial?.admin_notes).toBeNull();

      // Update notes and tracking number WITHOUT specifying status
      const updateRes = await updateAdminOrderStatus(
        orderId,
        undefined,
        "PATHAO-TRK-778899",
        "Customer called to verify dispatch time. Delivery scheduled."
      );

      expect(updateRes.success).toBe(true);

      const updated = await getOrderById(orderId);
      expect(updated?.status).toBe("pending"); // Preserved!
      expect(updated?.tracking_number).toBe("PATHAO-TRK-778899");
      expect(updated?.admin_notes).toBe("Customer called to verify dispatch time. Delivery scheduled.");
    });

    it("admin orders API PATCH accepts updates without requiring status field", async () => {
      const orderRes = await createGuestOrder({
        customerName: "API Notes Test",
        customerPhone: "01811223344",
        customerEmail: "apinotes@flashwear.store",
        deliveryAddress: "Road 11, Block D, Gulshan 2",
        division: "Dhaka",
        district: "Dhaka",
        paymentMethod: "cash_on_delivery",
        items: [{ variantId: "var-1", quantity: 1 }],
      });

      expect(orderRes.success).toBe(true);
      const orderId = orderRes.orderId!;

      const req = new Request("http://localhost:3000/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": process.env.ADMIN_SECRET_KEY || "flashwear-dev-admin",
        },
        body: JSON.stringify({
          orderId,
          adminNotes: "Internal resolution: address confirmed with customer",
        }),
      });

      const res = await adminOrdersPatch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      const updated = await getOrderById(orderId);
      expect(updated?.admin_notes).toBe("Internal resolution: address confirmed with customer");
      expect(updated?.status).toBe("pending");
    });
  });

  describe("2. Confidentiality of Internal Notes from Customer Pages", () => {
    it("strips admin_notes when customer retrieves order via order number and receipt token", async () => {
      const orderRes = await createGuestOrder({
        customerName: "Privacy Customer",
        customerPhone: "01911223344",
        customerEmail: "privacy@flashwear.store",
        deliveryAddress: "Dhanmondi 27",
        division: "Dhaka",
        district: "Dhaka",
        paymentMethod: "cash_on_delivery",
        items: [{ variantId: "var-1", quantity: 1 }],
      });

      expect(orderRes.success).toBe(true);
      const { orderNumber, receiptToken, orderId } = orderRes;

      // Add a private internal admin note
      await updateAdminOrderStatus(
        orderId!,
        undefined,
        undefined,
        "CONFIDENTIAL: Customer requested priority courier handling."
      );

      // Verify admin sees the note
      const adminView = await getOrderById(orderId!);
      expect(adminView?.admin_notes).toContain("CONFIDENTIAL");

      // Verify customer token retrieval strips the note
      const customerView = await getOrderByNumberAndToken(orderNumber!, receiptToken!);
      expect(customerView).not.toBeNull();
      expect(customerView?.admin_notes).toBeNull();
    });

    it("strips admin_notes in authenticated customer order history queries", async () => {
      const testUserId = `user-${Date.now()}`;
      const orderRes = await createGuestOrder({
        userId: testUserId,
        customerName: "Account Owner",
        customerPhone: "01711998877",
        customerEmail: "accountowner@flashwear.store",
        deliveryAddress: "Uttara Sector 3",
        division: "Dhaka",
        district: "Dhaka",
        paymentMethod: "cash_on_delivery",
        items: [{ variantId: "var-1", quantity: 1 }],
      });

      expect(orderRes.success).toBe(true);

      await updateAdminOrderStatus(
        orderRes.orderId!,
        undefined,
        undefined,
        "STAFF ONLY: Verified payment voucher via bKash statement."
      );

      const customerOrders = await getCustomerOrders(testUserId);
      expect(customerOrders.length).toBeGreaterThan(0);
      for (const ord of customerOrders) {
        expect(ord.admin_notes).toBeNull();
      }

      const specificOrder = await getCustomerOrderByNumber(orderRes.orderNumber!, testUserId);
      expect(specificOrder).not.toBeNull();
      expect(specificOrder?.admin_notes).toBeNull();
    });
  });

  describe("3. Inventory Operational Hardening & Audit Enforcement", () => {
    it("rejects manual stock adjustments when reason is omitted or too short", async () => {
      const firstVariantId = INITIAL_PRODUCTS[0]?.variants?.[0]?.id || "var-1";

      const reqMissingReason = new Request("http://localhost:3000/api/admin/inventory", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": process.env.ADMIN_SECRET_KEY || "flashwear-dev-admin",
        },
        body: JSON.stringify({
          variantId: firstVariantId,
          quantity: 25,
        }),
      });

      const res = await adminInventoryPatch(reqMissingReason);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("operational reason");
    });

    it("accepts manual stock adjustment when valid authorized reason is supplied and logs audit", async () => {
      const firstVariant = INITIAL_PRODUCTS[0]?.variants?.[0];
      const variantId = firstVariant?.id || "var-1";
      const initialQty = firstVariant?.inventory_quantity || 18;
      const targetQty = initialQty + 5;

      const reqWithReason = new Request("http://localhost:3000/api/admin/inventory", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": process.env.ADMIN_SECRET_KEY || "flashwear-dev-admin",
        },
        body: JSON.stringify({
          variantId,
          quantity: targetQty,
          reason: "Vendor restock batch #8 verified in studio",
        }),
      });

      const res = await adminInventoryPatch(reqWithReason);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.audit).toBeDefined();
      expect(data.audit.reason).toBe("Vendor restock batch #8 verified in studio");
      expect(data.audit.difference).toBe(5);

      // Verify GET summary endpoint
      const getReq = new Request("http://localhost:3000/api/admin/inventory", {
        method: "GET",
        headers: {
          "x-admin-key": process.env.ADMIN_SECRET_KEY || "flashwear-dev-admin",
        },
      });

      const getRes = await adminInventoryGet(getReq);
      const getData = await getRes.json();

      expect(getRes.status).toBe(200);
      expect(getData.success).toBe(true);
      expect(getData.summary.totalVariants).toBeGreaterThan(0);
      expect(getData.recentAudits.length).toBeGreaterThan(0);
    });
  });
});
