import Link from "next/link";
import Image from "next/image";
import type { ShopifyProduct } from "@/lib/shopify/types";

interface ProductCardProps {
  product: ShopifyProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange?.minVariantPrice;
  const isOnSale =
    compareAt && Number(compareAt.amount) > Number(price.amount);

  return (
    <Link
      href={`/shop/product/${product.handle}`}
      className="group block rounded-2xl overflow-hidden bg-white border border-stone-200/60 shadow-sm hover:shadow-lg hover:border-stone-200 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-stone-50 overflow-hidden">
        {product.featuredImage ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            fill
            className="object-cover product-card-img"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-stone-300">
            🪈
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
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
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
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
      </div>
    </Link>
  );
}

function formatMoney(money: { amount: string; currencyCode: string }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: money.currencyCode,
    minimumFractionDigits: 0,
  }).format(Number(money.amount));
}
