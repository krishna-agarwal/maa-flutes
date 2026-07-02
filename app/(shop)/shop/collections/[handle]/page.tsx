import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { shopifyFetch } from "@/lib/shopify/client";
import { GET_COLLECTION } from "@/lib/shopify/queries";
import ProductCard from "@/components/shop/ProductCard";
import type { ShopifyCollection } from "@/lib/shopify/types";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const data = await shopifyFetch<{
    collectionByHandle: ShopifyCollection | null;
  }>({
    query: GET_COLLECTION,
    variables: { handle, productsFirst: 1 },
    tags: [`collection-${handle}`],
  });

  const collection = data.collectionByHandle;
  if (!collection) return { title: "Collection not found" };

  return {
    title: collection.title,
    description: collection.description || `Browse ${collection.title} products.`,
    alternates: {
      canonical: `/shop/collections/${handle}`,
    },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { handle } = await params;

  const data = await shopifyFetch<{
    collectionByHandle: ShopifyCollection | null;
  }>({
    query: GET_COLLECTION,
    variables: { handle, productsFirst: 24 },
    tags: [`collection-${handle}`],
  });

  const collection = data.collectionByHandle;
  if (!collection) notFound();

  const products = collection.products.edges.map((e) => e.node);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-stone-400 mb-10">
        <Link href="/shop" className="hover:text-amber-700 transition-colors">
          Shop
        </Link>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-stone-300"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="text-stone-700 font-medium">
          {collection.title}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
          {collection.title}
        </h1>
        <div className="flex items-center gap-3 mt-3">
          {collection.description && (
            <p className="text-stone-500 max-w-2xl">{collection.description}</p>
          )}
        </div>
        <p className="text-sm text-stone-400 mt-2">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="text-center py-24 bg-stone-50 rounded-2xl">
          <p className="text-5xl mb-4">🪈</p>
          <p className="text-stone-500 text-lg">
            No products in this collection yet.
          </p>
          <Link
            href="/shop"
            className="inline-block mt-6 px-6 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors"
          >
            Back to shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
