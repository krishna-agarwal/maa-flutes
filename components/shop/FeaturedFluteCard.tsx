"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/app/context/cart";
import type { ShopifyProduct } from "@/lib/shopify/types";

interface FeaturedFluteCardProps {
  product: ShopifyProduct;
}

export default function FeaturedFluteCard({ product }: FeaturedFluteCardProps) {
  const price = product.priceRange.minVariantPrice;
  const firstVariant = product.variants.edges[0]?.node;
  const variantId = firstVariant?.id || "";
  const availableForSale = firstVariant?.availableForSale ?? product.availableForSale;

  const { addItem, isVariantInCart } = useCart();
  const isInCart = isVariantInCart(variantId);
  const [addingToCart, setAddingToCart] = useState(false);

  async function handleAddToCart() {
    setAddingToCart(true);
    try {
      await addItem(variantId, 1);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingToCart(false);
    }
  }

  return (
    <div className="bg-stone-800 text-white rounded-lg overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Image and Title wrapper for mobile */}
      <div className="flex gap-4 sm:gap-0 w-full sm:w-auto">
        {/* Image */}
        {product.featuredImage && (
          <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-stone-700">
            <Image
              src={product.featuredImage.url}
              alt={product.title}
              fill
              className="object-cover"
              sizes="128px"
            />
          </div>
        )}

        {/* Title for mobile */}
        <div className="sm:hidden flex flex-col justify-center">
          <h3 className="text-lg font-bold">{product.title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow w-full">
        <h3 className="hidden sm:block text-lg font-bold">{product.title}</h3>
        <p className="text-stone-300 text-sm mt-1 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between gap-4 mt-0 sm:mt-2">
          <p className="text-amber-400 font-semibold">
            {formatMoney(price)}
          </p>
          {/* Button for mobile and desktop */}
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || !availableForSale}
            className={`flex-shrink-0 px-6 py-2 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap ${
              !availableForSale
                ? "bg-stone-600 text-stone-400 cursor-not-allowed"
                : isInCart
                ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                : "bg-amber-500 hover:bg-amber-600 text-stone-900 shadow-lg shadow-amber-500/20"
            } disabled:opacity-60`}
          >
            {!availableForSale ? "Sold out" : isInCart ? "Added" : addingToCart ? "Adding..." : "Add to Cart"}
          </button>
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
