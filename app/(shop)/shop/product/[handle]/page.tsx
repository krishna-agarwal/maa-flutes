import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { shopifyFetch } from "@/lib/shopify/client";
import { GET_PRODUCT } from "@/lib/shopify/queries";
import ProductImageGallery from "@/components/shop/ProductImageGallery";
import VariantSelector from "@/components/shop/VariantSelector";
import type { ShopifyProduct } from "@/lib/shopify/types";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const data = await shopifyFetch<{ productByHandle: ShopifyProduct | null }>({
    query: GET_PRODUCT,
    variables: { handle },
    tags: [`product-${handle}`],
  });

  const product = data.productByHandle;
  if (!product) return { title: "Product not found" };

  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: {
      images: product.featuredImage
        ? [{ url: product.featuredImage.url, alt: product.title }]
        : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params;

  const data = await shopifyFetch<{ productByHandle: ShopifyProduct | null }>({
    query: GET_PRODUCT,
    variables: { handle },
    tags: [`product-${handle}`],
  });

  const product = data.productByHandle;
  if (!product) notFound();

  const images = product.images.edges.map((e) => e.node);
  const variants = product.variants.edges.map((e) => e.node);

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
        <span className="text-stone-700 truncate max-w-[260px] font-medium">
          {product.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery */}
        <ProductImageGallery images={images} title={product.title} />

        {/* Info */}
        <div className="lg:py-2">
          <div className="space-y-8">
            <div>
              {product.vendor && (
                <p className="text-sm font-medium text-amber-600 uppercase tracking-widest mb-2">
                  {product.vendor}
                </p>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
                {product.title}
              </h1>
            </div>

            {/* Divider */}
            <div className="border-t border-stone-100" />

            {/* Variant selector + Add to cart */}
            <VariantSelector variants={variants} />

            {/* Trust indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-600 flex-shrink-0">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs font-medium text-stone-600">Free shipping on orders above Rs.999</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-600 flex-shrink-0">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs font-medium text-stone-600">Quality guaranteed</span>
              </div>
            </div>

            {/* Description */}
            {product.descriptionHtml && (
              <div>
                <h2 className="text-base font-semibold text-stone-900 mb-4 uppercase tracking-wide">
                  Details
                </h2>
                <div
                  className="prose prose-stone prose-sm max-w-none text-stone-600 leading-relaxed prose-product"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="pt-2">
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-stone-100 text-stone-500 text-xs rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
