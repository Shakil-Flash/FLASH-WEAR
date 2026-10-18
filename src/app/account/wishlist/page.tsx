import { AccountNav } from "@/components/account/account-nav";
import { getCustomerWishlist } from "@/lib/services/accounts";
import { WishlistClient } from "./wishlist-client";

export const metadata = {
  title: "My Wishlist | FLASHWEAR",
  description: "View and manage your saved streetwear items.",
};

export default async function WishlistPage() {
  const wishlist = await getCustomerWishlist("usr-demo");

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#ccff00] font-mono mb-1">
            {"// SAVED APPAREL"}
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            My Wishlist
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <AccountNav />
          <main className="flex-1">
            <WishlistClient initialWishlist={wishlist} />
          </main>
        </div>
      </div>
    </div>
  );
}
