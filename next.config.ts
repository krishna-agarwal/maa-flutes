import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import createMDX from "@next/mdx";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

const withMDX = createMDX({});

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  images: {
    remotePatterns: [
      // Shopify CDN
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      // Supabase Storage (self-hosted — swap hostname in production)
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default withSerwist(withMDX(nextConfig));

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
