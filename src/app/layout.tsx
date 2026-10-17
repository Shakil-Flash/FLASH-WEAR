import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { AnnouncementBar } from "@/components/announcement-bar";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";

export const metadata: Metadata = {
  title: {
    default: "FLASHWEAR — Contemporary Engineered Streetwear",
    template: "%s | FLASHWEAR",
  },
  description:
    "Premium contemporary streetwear brand engineered in Dhaka, Bangladesh. Heavyweight 480 GSM French terry hoodies, oversized drop-shoulder tees, and tactical cargo trousers.",
  keywords: [
    "FLASHWEAR",
    "streetwear Bangladesh",
    "Dhaka streetwear",
    "oversized hoodie",
    "heavyweight tee",
    "cargo pants Dhaka",
    "Cash on Delivery Bangladesh",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "FLASHWEAR — Contemporary Engineered Streetwear",
    description:
      "Premium contemporary streetwear brand engineered in Dhaka, Bangladesh. Drop 01 available nationwide via Cash on Delivery.",
    url: "/",
    siteName: "FLASHWEAR",
    locale: "en_BD",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0b] text-[#f4f4f5] min-h-screen flex flex-col font-sans">
        <CartProvider>
          <AnnouncementBar />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
