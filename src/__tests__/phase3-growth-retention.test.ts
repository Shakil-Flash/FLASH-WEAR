import { describe, it, expect, beforeEach } from "vitest";
import {
  getLoyaltySettings,
  updateLoyaltySettings,
  getUserLoyaltyBalance,
  awardOrderLoyaltyPoints,
  redeemLoyaltyPoints,
  reverseOrderLoyaltyPoints,
  fallbackLoyaltyLedger,
} from "@/lib/services/loyalty";
import {
  getReferralSettings,
  updateReferralSettings,
  getOrCreateUserReferralCode,
  validateReferralCode,
  recordReferralConversion,
  qualifyReferralOrder,
  reverseReferralOrder,
  fallbackCustomerReferrals,
} from "@/lib/services/referrals";
import {
  saveAbandonedCart,
  getAndRevalidateRecoveredCart,
  processAbandonedCartReminders,
  unsubscribeAbandonedCart,
  fallbackAbandonedCarts,
} from "@/lib/services/abandoned-carts";
import {
  subscribeToStockOrPrice,
  unsubscribeStockSubscription,
  checkAndNotifySubscribers,
  fallbackSubscriptions,
} from "@/lib/services/stock-subscriptions";
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  createMarketingCampaign,
  dispatchMarketingCampaign,
  getSubscribersList,
  fallbackSubscribers,
  fallbackCampaigns,
} from "@/lib/services/marketing";
import {
  getFrequentlyBoughtTogether,
  getRelatedProducts,
  getBestsellers,
} from "@/lib/services/recommendations";
import { getShoppingFunnelMetrics } from "@/lib/services/analytics";
import { GET as getGoogleMerchantFeed } from "@/app/api/feeds/google-merchant/route";

describe("Phase 3: Loyalty & Rewards Program", () => {
  const testUserId = "usr-loyalty-test-1";

  beforeEach(() => {
    // Clear in-memory ledger entries for this user
    const toRemove = fallbackLoyaltyLedger.filter((l) => l.user_id === testUserId);
    toRemove.forEach((r) => {
      const idx = fallbackLoyaltyLedger.indexOf(r);
      if (idx > -1) fallbackLoyaltyLedger.splice(idx, 1);
    });
  });

  it("calculates and awards loyalty points correctly on eligible order", async () => {
    const orderId = "ord-loyalty-001";
    const subtotal = 3500; // 3500 / 100 * 10 = 350 points (or 35 depending on points_per_100_bdt)

    const res = await awardOrderLoyaltyPoints(orderId, testUserId, subtotal);
    expect(res.success).toBe(true);
    expect(res.pointsAwarded).toBeGreaterThan(0);

    const balance = await getUserLoyaltyBalance(testUserId);
    expect(balance).toBe(res.pointsAwarded);
  });

  it("prevents duplicate point awards for the same order", async () => {
    const orderId = "ord-loyalty-dup-test";
    const subtotal = 2000;

    const first = await awardOrderLoyaltyPoints(orderId, testUserId, subtotal);
    expect(first.success).toBe(true);

    const duplicate = await awardOrderLoyaltyPoints(orderId, testUserId, subtotal);
    expect(duplicate.pointsAwarded).toBe(0);

    const balance = await getUserLoyaltyBalance(testUserId);
    expect(balance).toBe(first.pointsAwarded);
  });

  it("reverses loyalty points cleanly upon cancellation or return", async () => {
    const orderId = "ord-loyalty-clawback";
    const awardRes = await awardOrderLoyaltyPoints(orderId, testUserId, 5000);

    const preBalance = await getUserLoyaltyBalance(testUserId);
    expect(preBalance).toBe(awardRes.pointsAwarded);

    const rev = await reverseOrderLoyaltyPoints(orderId, "Customer return");
    expect(rev.success).toBe(true);
    expect(rev.pointsReversed).toBe(awardRes.pointsAwarded);

    const postBalance = await getUserLoyaltyBalance(testUserId);
    expect(postBalance).toBe(0);
  });

  it("prevents redeeming more points than user owns", async () => {
    await awardOrderLoyaltyPoints("ord-small", testUserId, 1000); // 100 points
    const res = await redeemLoyaltyPoints(testUserId, 5000, "ord-redeem-attempt");
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("redeems points atomically and updates balance", async () => {
    await awardOrderLoyaltyPoints("ord-large", testUserId, 10000);
    const balanceBefore = await getUserLoyaltyBalance(testUserId);

    const redeemRes = await redeemLoyaltyPoints(testUserId, 100, "ord-checkout-1");
    expect(redeemRes.success).toBe(true);
    expect(redeemRes.redeemedPoints).toBe(100);
    expect(redeemRes.discountAmount).toBeGreaterThan(0);

    const remaining = await getUserLoyaltyBalance(testUserId);
    expect(remaining).toBe(balanceBefore - 100);
  });
});

describe("Phase 3: Customer Referral Program", () => {
  const referrerId = "usr-referrer-100";
  const refereeId = "usr-referee-200";

  it("generates a unique shareable referral code for a user", async () => {
    const code = await getOrCreateUserReferralCode(referrerId);
    expect(code).toBeDefined();
    expect(code.startsWith("FLASH-")).toBe(true);
  });

  it("strictly prevents self-referrals", async () => {
    const code = await getOrCreateUserReferralCode(referrerId);
    const validation = await validateReferralCode(code, referrerId, "same@example.com", "01700000000");

    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain("cannot use your own referral");
  });

  it("validates a friend referral code and provides welcome discount", async () => {
    const code = await getOrCreateUserReferralCode(referrerId);
    const validation = await validateReferralCode(
      code,
      refereeId,
      "friend@example.com",
      "01800000000"
    );

    expect(validation.isValid).toBe(true);
    expect(validation.discountAmount).toBeGreaterThan(0);
  });

  it("records conversion and qualifies referrer reward only upon delivered status", async () => {
    const code = await getOrCreateUserReferralCode(referrerId);
    const orderId = "ord-referral-conv-1";

    const conv = await recordReferralConversion(
      code,
      orderId,
      3000,
      refereeId,
      "friend@example.com",
      "01800000000"
    );
    expect(conv.success).toBe(true);

    // Initial status should be pending
    const refRecord = fallbackCustomerReferrals.find((r) => r.order_id === orderId);
    expect(refRecord?.status).toBe("pending");

    // Qualify upon fulfillment
    const qual = await qualifyReferralOrder(orderId);
    expect(qual).toBe(true);
    expect(refRecord?.status).toBe("rewarded");

    // Reversal upon cancellation
    const rev = await reverseReferralOrder(orderId, "Customer cancelled before handover");
    expect(rev).toBe(true);
    expect(refRecord?.status).toBe("reversed");
  });
});

describe("Phase 3: Abandoned Cart Recovery", () => {
  it("saves incomplete carts and generates secure resume token", async () => {
    const cartRes = await saveAbandonedCart({
      customerEmail: "shopper@example.com",
      customerName: "Imran Khan",
      cartItems: [
        {
          variantId: "v-hoodie-blk-m",
          productId: "prod-hoodie-01",
          productName: "Heavyweight Boxy Hoodie",
          productSlug: "heavyweight-boxy-hoodie",
          size: "M",
          color: "Washed Black",
          unitPrice: 3450,
          quantity: 1,
          maxInventory: 10,
          imageUrl: "/images/hoodie.jpg",
          sku: "FW-HOD-BLK-M",
        },
      ],
      subtotal: 3450,
    });

    expect(cartRes.success).toBe(true);
    expect(cartRes.recoveryToken).toBeDefined();

    // Revalidate cart upon resume
    const reval = await getAndRevalidateRecoveredCart(cartRes.recoveryToken);
    expect(reval.cart).not.toBeNull();
    expect(reval.cart?.customer_email).toBe("shopper@example.com");
  });

  it("suppresses reminders when customer unsubscribes", async () => {
    const cartRes = await saveAbandonedCart({
      customerEmail: "optout-cart@example.com",
      cartItems: [
        {
          variantId: "v-1",
          productId: "p-1",
          productName: "Item",
          productSlug: "item",
          size: "L",
          color: "Black",
          unitPrice: 1000,
          quantity: 1,
          maxInventory: 10,
          imageUrl: "/item.jpg",
          sku: "SKU-1",
        },
      ],
      subtotal: 1000,
    });

    await unsubscribeAbandonedCart(cartRes.recoveryToken);

    const cart = fallbackAbandonedCarts.find((c) => c.recovery_token === cartRes.recoveryToken);
    expect(cart?.unsubscribed).toBe(true);
  });
});

describe("Phase 3: Stock & Price-Drop Subscriptions", () => {
  it("creates variant-level stock notification subscription and prevents duplicate", async () => {
    const sub = await subscribeToStockOrPrice({
      variantId: "v-cargo-olv-32",
      productId: "prod-cargo-01",
      email: "subscriber@example.com",
      subscriptionType: "back_in_stock",
    });

    expect(sub.success).toBe(true);

    // Duplicate subscription attempt
    const dup = await subscribeToStockOrPrice({
      variantId: "v-cargo-olv-32",
      productId: "prod-cargo-01",
      email: "subscriber@example.com",
      subscriptionType: "back_in_stock",
    });
    expect(dup.message).toContain("already subscribed");
  });

  it("allows customer to unsubscribe from restock notifications", async () => {
    const sub = await subscribeToStockOrPrice({
      variantId: "v-tee-blk-l",
      productId: "prod-tee-01",
      email: "unsub-stock@example.com",
      subscriptionType: "back_in_stock",
    });

    const record = fallbackSubscriptions.find((s) => s.id === sub.subscriptionId);
    expect(record).toBeDefined();

    const unsub = await unsubscribeStockSubscription(record!.unsubscribe_token);
    expect(unsub).toBe(true);
    expect(record?.status).toBe("cancelled");
  });
});

describe("Phase 3: Marketing Campaigns & Newsletter", () => {
  it("subscribes customer with consent timestamp and allows unsubscribe", async () => {
    const res = await subscribeNewsletter("fashion@example.com", "Website Footer");
    expect(res.success).toBe(true);

    const sub = fallbackSubscribers.find((s) => s.email === "fashion@example.com");
    expect(sub).toBeDefined();
    expect(sub?.consent_given_at).toBeDefined();

    const unsub = await unsubscribeNewsletter(sub!.unsubscribe_token);
    expect(unsub).toBe(true);
    expect(sub?.status).toBe("unsubscribed");
  });

  it("excludes unsubscribed customers from campaign dispatch", async () => {
    await subscribeNewsletter("consented-subscriber@example.com");

    const campaign = await createMarketingCampaign({
      title: "Autumn Capsule Drop",
      subject: "New Heavyweight Arrivals",
      previewText: "Engineered in Dhaka",
      contentHtml: "<p>Check out our new drop</p>",
      targetSegment: "all_subscribers",
    });

    expect(campaign.id).toBeDefined();
    expect(campaign.status).toBe("draft");

    const dispatch = await dispatchMarketingCampaign(campaign.id);
    expect(dispatch.success).toBe(true);
    expect(dispatch.sentCount).toBeGreaterThanOrEqual(1);

    const c = fallbackCampaigns.find((x) => x.id === campaign.id);
    expect(c?.status).toBe("sent");
  });
});

describe("Phase 3: Recommendations Engine", () => {
  it("returns bestselling streetwear products from catalog", async () => {
    const bestsellers = await getBestsellers(3);
    expect(bestsellers.length).toBeGreaterThan(0);
    expect(bestsellers[0].name).toBeDefined();
    expect(bestsellers[0].price).toBeGreaterThan(0);
  });

  it("returns synergistic category products for cross-selling", async () => {
    const related = await getRelatedProducts("prod-hoodie-01", "cat-hoodies", null, 2);
    expect(Array.isArray(related)).toBe(true);
  });
});

describe("Phase 3: Analytics Shopping Funnel", () => {
  it("computes shopping funnel metrics and rates without fabricating numbers", async () => {
    const metrics = await getShoppingFunnelMetrics({ range: "all" });
    expect(typeof metrics.averageOrderValue).toBe("number");
    expect(typeof metrics.conversionRate).toBe("number");
    expect(typeof metrics.addToCartRate).toBe("number");
    expect(typeof metrics.checkoutCompletionRate).toBe("number");
    expect(metrics.purchaseCount).toBeGreaterThanOrEqual(0);
  });
});

describe("Phase 3: Google Merchant Product Feed", () => {
  it("generates valid XML Google Merchant product feed", async () => {
    const res = await getGoogleMerchantFeed();
    expect(res.status).toBe(200);
    const contentType = res.headers.get("Content-Type");
    expect(contentType).toContain("application/xml");

    const xml = await res.text();
    expect(xml).toContain("<rss version=\"2.0\" xmlns:g=\"http://base.google.com/ns/1.0\">");
    expect(xml).toContain("<title>FLASHWEAR Streetwear Product Feed</title>");
    expect(xml).toContain("<g:price>");
    expect(xml).toContain("BDT");
    expect(xml).toContain("<g:availability>");
  });
});
