import { AccountNav } from "@/components/account/account-nav";
import { getCustomerAddresses } from "@/lib/services/accounts";
import { AddressesClient } from "./addresses-client";

export const metadata = {
  title: "Delivery Addresses | FLASHWEAR",
  description: "Manage your saved delivery addresses for fast streetwear checkout.",
};

export default async function AddressesPage() {
  const addresses = await getCustomerAddresses("usr-demo");

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#181818] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5938] mb-1">
            Shipping Destinations
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#181818]">
            Saved Addresses
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />
          <main className="flex-1 w-full">
            <AddressesClient initialAddresses={addresses} />
          </main>
        </div>
      </div>
    </div>
  );
}
