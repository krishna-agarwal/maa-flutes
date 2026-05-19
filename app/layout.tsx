import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/app/context/cart";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Maa Flutes — Indian Classical Flute",
    template: "%s | Maa Flutes",
  },
  description:
    "Handcrafted Indian classical flutes, music tools, and courses for every level of player.",
  keywords: [
    "Indian flute",
    "bansuri",
    "classical music",
    "flute shop",
    "handcrafted bansuri",
    "Indian classical music",
    "bansuri online",
  ],
  authors: [{ name: "Maa Flutes" }],
  creator: "Maa Flutes",
  openGraph: {
    type: "website",
    siteName: "Maa Flutes",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    site: "@maaflutes",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#92400e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
