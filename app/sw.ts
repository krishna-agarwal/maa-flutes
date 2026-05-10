import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  Serwist,
  NetworkFirst,
  CacheFirst,
  ExpirationPlugin,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache tool pages for offline use
    {
      matcher: /^\/(tools)(\/.*)?$/,
      handler: new NetworkFirst({
        cacheName: "tools-pages",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
          }),
        ],
      }),
    },
    // Cache Shopify product images
    {
      matcher: /^https:\/\/cdn\.shopify\.com\/.*/,
      handler: new CacheFirst({
        cacheName: "shopify-images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },
    // Cache Google Fonts
    {
      matcher: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
      handler: new CacheFirst({
        cacheName: "google-fonts",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();
