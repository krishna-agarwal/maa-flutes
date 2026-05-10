import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/app/context/cart";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Maa Flutes — Indian Classical Flute",
    template: "%s | Maa Flutes",
  },
  description:
    "Handcrafted Indian classical flutes, music tools, and courses for every level of player.",
  keywords: ["Indian flute", "bansuri", "classical music", "flute shop"],
  openGraph: {
    type: "website",
    siteName: "Maa Flutes",
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
