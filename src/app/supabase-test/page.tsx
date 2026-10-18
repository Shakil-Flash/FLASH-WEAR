import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function SupabaseTestPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Demonstrate queries using the new SSR server client
  const { data: products } = await supabase.from("products").select("id, name, price, slug").limit(5);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#181818] p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white border border-[#E7E3DC] rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-bold uppercase tracking-wider mb-2">Supabase SSR Connection Test</h1>
        <p className="text-sm text-[#706E6B] mb-6">
          Verified live query using <code>@/utils/supabase/server</code> and <code>@supabase/ssr</code>.
        </p>

        {products && products.length > 0 ? (
          <ul className="divide-y divide-[#E7E3DC]">
            {products.map((item: any) => (
              <li key={item.id} className="py-3 flex justify-between items-center text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="font-mono text-[#FF5938]">৳{item.price?.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#706E6B] italic">
            Connected to project <code>bonxxnreijxgadfgjuld</code>. Run migrations to populate tables.
          </p>
        )}
      </div>
    </div>
  );
}
