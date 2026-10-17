import React from "react";
import { Star, CheckCircle } from "lucide-react";

export function ReviewsSection() {
  const sampleReviews = [
    {
      id: "rev-1",
      name: "Tanvir H.",
      location: "Gulshan, Dhaka",
      product: "FLASH Matrix Oversized Hoodie",
      rating: 5,
      comment: "The 480 GSM fabric weight is insane. No brand in Bangladesh is doing this level of drop shoulder cut. Arrived via COD within 24 hours.",
      verified: true,
      date: "Sample Customer Feedback",
    },
    {
      id: "rev-2",
      name: "Samiul A.",
      location: "Chittagong",
      product: "Transit Tactical Cargo Pant",
      rating: 5,
      comment: "Bungee ankle toggles let you swap between straight leg and stacked jogger silhouette. Deep pockets fit my tech easily. Worth every taka.",
      verified: true,
      date: "Sample Customer Feedback",
    },
    {
      id: "rev-3",
      name: "Nafis K.",
      location: "Dhanmondi, Dhaka",
      product: "Cyber Acid Graphic Tee",
      rating: 5,
      comment: "Screen print didn't crack after machine wash. The 240 GSM combed cotton feels dense and premium. Definitely getting more colors.",
      verified: true,
      date: "Sample Customer Feedback",
    },
  ];

  return (
    <section className="py-20 bg-[#0a0a0b] border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-block px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
            [Sample Customer Showcase — Phase 1 Preview]
          </div>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
            Tested On The Street
          </h2>
          <p className="text-xs text-zinc-400 mt-2">
            What early wearers are saying about our heavyweight silhouettes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 bg-[#111113] border border-zinc-800/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#ccff00] text-[#ccff00]" />
                  ))}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic mb-6">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">{rev.name}</h4>
                    <p className="text-[11px] font-mono text-zinc-500">{rev.location}</p>
                  </div>
                  {rev.verified && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#ccff00]">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-mono text-zinc-400 mt-2">
                  Purchased: {rev.product}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
