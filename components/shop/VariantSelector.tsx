"use client";

import { useState } from "react";
import type { ShopifyProductVariant } from "@/lib/shopify/types";
import AddToCartButton from "./AddToCartButton";

interface VariantSelectorProps {
  variants: ShopifyProductVariant[];
}

export default function VariantSelector({ variants }: VariantSelectorProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants[0]?.id ?? ""
  );

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const hasMultipleVariants = variants.length > 1;

  return (
    <div className="space-y-6">
      {/* Variant picker — only show when there are real options */}
      {hasMultipleVariants && (
        <div>
          <p className="text-sm font-medium text-stone-700 mb-3">Options</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariantId(variant.id)}
                disabled={!variant.availableForSale}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  selectedVariantId === variant.id
                    ? "border-amber-600 bg-amber-50 text-amber-700"
                    : "border-stone-200 text-stone-700 hover:border-stone-300"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {variant.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      {selectedVariant && (
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-stone-900">
            {formatMoney(selectedVariant.price)}
          </span>
          {selectedVariant.compareAtPrice &&
            Number(selectedVariant.compareAtPrice.amount) >
              Number(selectedVariant.price.amount) && (
              <>
                <span className="text-lg text-stone-400 line-through">
                  {formatMoney(selectedVariant.compareAtPrice)}
                </span>
                <span className="text-sm font-semibold text-red-500">
                  {Math.round(
                    ((Number(selectedVariant.compareAtPrice.amount) -
                      Number(selectedVariant.price.amount)) /
                      Number(selectedVariant.compareAtPrice.amount)) *
                      100
                  )}
                  % off
                </span>
              </>
            )}
        </div>
      )}

      {/* Add to cart */}
      <AddToCartButton
        variantId={selectedVariantId}
        availableForSale={selectedVariant?.availableForSale ?? false}
      />
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
