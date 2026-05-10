import Link from "next/link";
import type { ShopifyProduct } from "@/lib/shopify/types";
import ProductCardCarousel from "./ProductCardCarousel";
import ProductCardActions from "./ProductCardActions";

interface ProductCardProps {
  product: ShopifyProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange?.minVariantPrice;
  const isOnSale =
    compareAt && Number(compareAt.amount) > Number(price.amount);

  // Use images array if available, fallback to featured image
  const carouselImages = product.images?.edges && product.images.edges.length > 0
    ? product.images.edges.map((e) => e.node)
    : product.featuredImage
    ? [product.featuredImage]
    : [];

  // Get first variant ID for add to cart
  const firstVariantId = product.variants?.edges?.[0]?.node?.id ?? null;

  const badges = (
    <>
      {isOnSale && (
        <span className="px-2.5 py-1 text-xs font-semibold bg-red-500 text-white rounded-full shadow-sm">
          Sale
        </span>
      )}
      {!product.availableForSale && (
        <span className="px-2.5 py-1 text-xs font-semibold bg-stone-700 text-white rounded-full shadow-sm">
          Sold out
        </span>
      )}
    </>
  );

  return (
    <div className="group block rounded-2xl overflow-hidden bg-white border border-stone-200/60 shadow-sm hover:shadow-lg hover:border-stone-200 transition-all duration-300">
      {/* Carousel */}
      <ProductCardCarousel
        images={carouselImages}
        href={`/shop/product/${product.handle}`}
        title={product.title}
        badges={badges}
      />

      {/* Info & Actions */}
      <div className="p-4">
        <Link
          href={`/shop/product/${product.handle}`}
          className="block hover:opacity-80 transition-opacity"
        >
          {product.vendor && (
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">
              {product.vendor}
            </p>
          )}
          <h3 className="font-medium text-stone-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug">
            {product.title}
          </h3>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-semibold text-stone-900">
              {formatMoney(price)}
            </span>
            {isOnSale && compareAt && (
              <span className="text-sm text-stone-400 line-through">
                {formatMoney(compareAt)}
              </span>
            )}
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="mt-3">
          <ProductCardActions
            variantId={firstVariantId}
            availableForSale={product.availableForSale}
          />
        </div>
      </div>
    </div>
  );
}

function formatMoney(money: { amount: string; currencyCode: string }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: money.currencyCode,
    minimumFractionDigits: 0,
  }).format(Number(money.amount));
}
