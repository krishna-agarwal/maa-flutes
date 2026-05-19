"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShopifyProduct } from "@/lib/shopify/types";
import { fetchProductByScale } from "@/lib/shopify/product-queries";

const SCALES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

interface ScaleNudgeCardProps {
  selectedScale: string;
  onScaleChange: (scale: string) => void;
}

export function ScaleNudgeCard({
  selectedScale,
  onScaleChange,
}: ScaleNudgeCardProps) {
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const p = await fetchProductByScale(selectedScale);
        setProduct(p);
      } catch (error) {
        console.error("Failed to load product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [selectedScale]);

  return (
    <div className="border border-amber-500/30 rounded-lg bg-black/20 p-3">
      {/* <h3 className="text-sm font-bold text-amber-300 mb-2">
        🪈 Get Your Bansuri
      </h3> */}

      {/* Product display */}
      {loading ? (
        <div className="h-16 bg-white/5 rounded animate-pulse" />
      ) : product ? (
        <div className="flex gap-3 items-start">
          {/* Product image - small square on left */}
          {product.featuredImage && (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText || product.title}
              className="w-16 h-16 object-cover rounded bg-black/30 flex-shrink-0"
            />
          )}

          {/* Product info on right */}
          <div className="flex-1 min-w-0 flex flex-col">
            <p className="text-[11px] text-white/80 font-medium line-clamp-2 mb-2">
              {product.title}
            </p>
            <div className="flex items-center justify-between gap-2 mt-auto">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-amber-300">
                  ₹{Number(product.priceRange.minVariantPrice.amount).toLocaleString("en-IN")}
                </span>
                {product.compareAtPriceRange?.minVariantPrice &&
                Number(product.compareAtPriceRange.minVariantPrice.amount) > 0 && (
                  <span className="text-[9px] text-white/40 line-through">
                    ₹
                    {Number(
                      product.compareAtPriceRange.minVariantPrice.amount
                    ).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-2.5 py-1 rounded transition-colors flex-shrink-0"
              >
                Shop →
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
