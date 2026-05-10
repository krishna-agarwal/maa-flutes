import type { Metadata } from "next";
import Image from "next/image";
import { shopifyFetch } from "@/lib/shopify/client";
import { GET_PRODUCTS } from "@/lib/shopify/queries";
import ProductCard from "@/components/shop/ProductCard";
import type { ShopifyProduct } from "@/lib/shopify/types";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse handcrafted Indian classical flutes and accessories.",
};

export default async function ShopPage() {
  const productsData = await shopifyFetch<{
    products: { edges: { node: ShopifyProduct }[] };
  }>({
    query: GET_PRODUCTS,
    variables: { first: 24 },
    tags: ["products"],
  });

  const products = productsData.products.edges.map((e) => e.node);

  // Use the first product's image as the hero background
  const heroImage = products.find((p) => p.featuredImage)?.featuredImage;

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-16 sm:py-20 lg:py-24">
            {/* Text */}
            <div>
              <p className="text-amber-400 font-medium text-sm tracking-widest uppercase mb-3">
                Handcrafted in India
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Shop Flutes &amp; Accessories
              </h1>
              <p className="mt-4 text-stone-300 max-w-lg text-lg leading-relaxed">
                Each flute is carefully tuned and crafted from seasoned bamboo.
                Browse our collection and find the perfect instrument for your
                musical journey.
              </p>
            </div>

            {/* Featured image */}
            {heroImage && (
              <div className="hidden lg:flex justify-end">
                <div className="relative w-80 h-80 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10">
                  <Image
                    src={heroImage.url}
                    alt="Featured flute"
                    fill
                    className="object-cover"
                    sizes="320px"
                    priority
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* All products */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">
                All Products
              </h2>
              <p className="text-stone-500 mt-1">
                {products.length} {products.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-24 bg-stone-50 rounded-2xl">
              <p className="text-5xl mb-4">🪈</p>
              <p className="text-stone-500 text-lg">
                No products found. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
