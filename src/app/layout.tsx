import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Jost } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MobileBar, WhatsAppFab } from "@/components/MobileBar";
import { StructuredData } from "@/components/StructuredData";
import { MetaPixel } from "@/components/MetaPixel";
import { MetaPageView } from "@/components/MetaEvents";
import { SITE_URL } from "@/lib/constants";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "ELIJAYS Men's Wear | Suits · Shirts · Trousers",
    template: "%s | ELIJAYS Men's Wear",
  },
  description:
    "Suits, shirts and finishing details. Kimathi Street at Muindi Mbingu × Biashara, Nairobi. WhatsApp orders, M-Pesa, free in-store alterations.",
  openGraph: {
    title: "ELIJAYS Men's Wear",
    description: "Command the room before you speak.",
    type: "website",
    url: SITE_URL,
  },
  metadataBase: new URL(SITE_URL),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const isAdmin = h.get("x-admin") === "1";

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col atmosphere">
        {isAdmin ? (
          children
        ) : (
          <>
            <StructuredData />
            <MetaPixel />
            <MetaPageView />
            <CartProvider>
              <Nav />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <Footer />
              <MobileBar />
              <WhatsAppFab />
            </CartProvider>
          </>
        )}
      </body>
    </html>
  );
}
