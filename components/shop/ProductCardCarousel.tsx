"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ShopifyImage } from "@/lib/shopify/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCardCarouselProps {
  images: ShopifyImage[];
  href: string;
  title: string;
  badges: React.ReactNode;
}

export default function ProductCardCarousel({
  images,
  href,
  title,
  badges,
}: ProductCardCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = images.length > 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex(index);
  };

  if (images.length === 0) {
    return (
      <Link href={href}>
        <div className="relative aspect-square bg-stone-50 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-4xl text-stone-300">
            🪈
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href}>
      <div className="relative aspect-square bg-stone-50 overflow-hidden group/carousel">
        {/* Main Image */}
        <Image
          key={activeIndex}
          src={images[activeIndex].url}
          alt={images[activeIndex].altText ?? title}
          fill
          className="object-cover product-card-img"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">{badges}</div>

        {/* Prev Arrow */}
        {hasMultipleImages && (
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 group-hover/carousel:opacity-100 opacity-0 transition-opacity duration-200 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Next Arrow */}
        {hasMultipleImages && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 group-hover/carousel:opacity-100 opacity-0 transition-opacity duration-200 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Dot Indicators */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => handleDotClick(index, e)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  index === activeIndex
                    ? "bg-white w-3"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
