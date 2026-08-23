import type { MetadataRoute } from "next";
import { getAllPostSlugs } from "@/lib/blog";
import { getAllCourseSlugs } from "@/lib/courses";
import { shopifyFetch } from "@/lib/shopify/client";
import { GET_PRODUCTS } from "@/lib/shopify/queries";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getProductHandles(): Promise<string[]> {
  try {
    const data = await shopifyFetch<{
      products: { edges: { node: { handle: string } }[] };
    }>({ query: GET_PRODUCTS, variables: { first: 250 } });
    return data.products.edges.map((e) => e.node.handle);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [postSlugs, courseSlugs, productHandles] = await Promise.all([
    getAllPostSlugs(),
    getAllCourseSlugs(),
    getProductHandles(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/courses`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/online-classes`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/loop-practice`, changeFrequency: "monthly", priority: 0.7 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = postSlugs.map((slug) => ({
    url: `${siteUrl}/blog/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const courseRoutes: MetadataRoute.Sitemap = courseSlugs.map((slug) => ({
    url: `${siteUrl}/courses/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const productRoutes: MetadataRoute.Sitemap = productHandles.map((handle) => ({
    url: `${siteUrl}/shop/product/${handle}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes, ...courseRoutes, ...productRoutes];
}
