"use client";

import { useState } from "react";
import Image from "next/image";
import type { ShopifyImage } from "@/lib/shopify/types";

interface ProductImageGalleryProps {
  images: ShopifyImage[];
  title: string;
}

export default function ProductImageGallery({
  images,
  title,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-stone-50 rounded-2xl flex items-center justify-center text-6xl border border-stone-100">
        🪈
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square bg-stone-50 rounded-2xl overflow-hidden border border-stone-100">
        <Image
          key={activeIndex}
          src={active.url}
          alt={active.altText ?? title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                activeIndex === i
                  ? "border-amber-600 shadow-sm"
                  : "border-stone-200 hover:border-stone-300 opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${title} ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
