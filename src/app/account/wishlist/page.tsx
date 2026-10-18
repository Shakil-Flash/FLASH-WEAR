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
    <div className="min-h-screen bg-[#F7F5F0] text-[#181818] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5938] mb-1">
            Saved Apparel
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#181818]">
            My Wishlist
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />
          <main className="flex-1 w-full">
            <WishlistClient initialWishlist={wishlist} />
          </main>
        </div>
      </div>
    </div>
  );
}
