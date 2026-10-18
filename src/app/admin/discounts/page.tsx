import { getAllCoupons } from "@/lib/services/coupons";
import { DiscountsClient } from "./discounts-client";

export const metadata = {
  title: "Coupon Management | FLASHWEAR Admin",
};

export default async function AdminDiscountsPage() {
  const coupons = await getAllCoupons();
  return <DiscountsClient initialCoupons={coupons} />;
}
