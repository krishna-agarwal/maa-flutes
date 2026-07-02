import type { Metadata } from "next";
import Image from "next/image";
import { shopifyFetch } from "@/lib/shopify/client";
import { GET_PRODUCTS } from "@/lib/shopify/queries";
import ProductCard from "@/components/shop/ProductCard";
import FeaturedFluteCard from "@/components/shop/FeaturedFluteCard";
import type { ShopifyProduct } from "@/lib/shopify/types";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse handcrafted Indian classical flutes and accessories.",
  alternates: {
    canonical: "/shop",
  },
};

function categorizeProduct(product: ShopifyProduct): string {
  const title = product.title.toLowerCase();
  if (title.includes("bass") || title.includes("bansuri")) return "Bass Flutes";
  if (title.includes("natural")) return "Natural Flutes";
  if (title.includes("accessory") || title.includes("accessories")) return "Accessories";
  return "Flutes";
}

function isFeaturedFlute(product: ShopifyProduct): boolean {
  return product.tags.some(tag => tag.toLowerCase() === "featured");
}

export default async function ShopPage() {
  const productsData = await shopifyFetch<{
    products: { edges: { node: ShopifyProduct }[] };
  }>({
    query: GET_PRODUCTS,
    variables: { first: 50 },
    tags: ["products"],
  });

  const products = productsData.products.edges.map((e) => e.node);

  // Find featured flutes
  const featuredFlutes = products.filter(isFeaturedFlute).slice(0, 2);
  const heroImage = featuredFlutes[0]?.featuredImage || products.find((p) => p.featuredImage)?.featuredImage;
  const featuredProduct = featuredFlutes[0];

  // Group products by category
  const grouped = products.reduce(
    (acc, product) => {
      const category = categorizeProduct(product);
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    },
    {} as Record<string, ShopifyProduct[]>
  );

  return (
    <>
      {/* Hero */}
      <section className="relative bg-stone-950 text-white overflow-hidden">
        {/* Background image */}
        {heroImage && (
          <div className="absolute inset-0">
            <Image
              src={heroImage.url}
              alt=""
              fill
              className="object-cover opacity-30 scale-105 blur-sm"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-stone-950/40" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center py-8 sm:py-10 lg:py-12">
            {/* Text */}
            <div>
              {/* <p className="text-amber-400 font-medium text-xs tracking-widest uppercase mb-2">
                Handcrafted in India
              </p> */}
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Shop Flutes &amp; Accessories
              </h1>
              <p className="mt-3 text-stone-300 max-w-lg text-sm leading-relaxed">
                Each flute is carefully tuned and crafted from seasoned bamboo.
                Browse our collection and find the perfect instrument for your
                musical journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Flutes Section */}
      {featuredFlutes.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Featured Flutes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredFlutes.map((product) => (
              <FeaturedFluteCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="text-center py-24 bg-stone-50 rounded-2xl">
            <p className="text-5xl mb-4">🪈</p>
            <p className="text-stone-500 text-lg">
              No products found. Check back soon!
            </p>
          </div>
        ) : (
          <>
            {["Natural Flutes", "Bass Flutes", "Flutes", "Accessories"].map((category) => {
              const categoryProducts = grouped[category];
              if (!categoryProducts || categoryProducts.length === 0) return null;
              return (
                <section key={category} className="mb-12">
                  <h2 className="text-2xl font-bold text-stone-900 mb-4">
                    {category} ({categoryProducts.length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
