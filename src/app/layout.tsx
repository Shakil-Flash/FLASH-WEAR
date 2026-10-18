import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";

export const metadata: Metadata = {
  title: {
    default: "FLASHWEAR — Everyday Streetwear Turned Up",
    template: "%s | FLASHWEAR",
  },
  description:
    "Authentic contemporary streetwear. Heavyweight cotton essentials, relaxed fits, and easy pieces crafted for Bangladesh.",
  keywords: [
    "FLASHWEAR",
    "streetwear Bangladesh",
    "Dhaka clothing brand",
    "oversized hoodie",
    "heavyweight tee",
    "cargo pants Dhaka",
    "Cash on Delivery Bangladesh",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "FLASHWEAR — Everyday Streetwear Turned Up",
    description:
      "Easy pieces. Big mood. Find your next favorite fit with nationwide Cash on Delivery in Bangladesh.",
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
    <html lang="en">
      <body className="bg-[#F7F5F0] text-[#181818] min-h-screen flex flex-col font-sans">
        <CartProvider>
          <GoogleAnalytics />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
