"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="group relative aspect-square bg-stone-50 rounded-2xl overflow-hidden border border-stone-100">
        <Image
          src={active.url}
          alt={active.altText ?? title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Prev Arrow */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 group-hover:opacity-100 opacity-0 transition-opacity duration-200 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Next Arrow */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 group-hover:opacity-100 opacity-0 transition-opacity duration-200 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
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
