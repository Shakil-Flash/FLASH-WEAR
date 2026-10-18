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
    <div className="min-h-screen bg-[#0a0a0b] text-white pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#ccff00] font-mono mb-1">
            {"// SHIPPING DESTINATIONS"}
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Saved Addresses
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <AccountNav />
          <main className="flex-1">
            <AddressesClient initialAddresses={addresses} />
          </main>
        </div>
      </div>
    </div>
  );
}
