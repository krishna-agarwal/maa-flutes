"use client";

import { useState } from "react";
import { useCart } from "@/app/context/cart";

interface AddToCartButtonProps {
  variantId: string;
  availableForSale: boolean;
}

export default function AddToCartButton({
  variantId,
  availableForSale,
}: AddToCartButtonProps) {
  const { addItem, isVariantInCart } = useCart();
  const isInCart = isVariantInCart(variantId);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddToCart() {
    setError(null);
    setAddingToCart(true);
    try {
      await addItem(variantId, 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add to cart";
      setError(message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setAddingToCart(false);
    }
  }

  if (!availableForSale) {
    return (
      <button
        disabled
        className="w-full py-4 bg-stone-100 text-stone-400 font-semibold rounded-xl cursor-not-allowed border border-stone-200"
      >
        Sold out
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleAddToCart}
        disabled={addingToCart}
        className={`w-full py-4 font-semibold rounded-xl transition-all duration-200 text-base tracking-wide ${
          isInCart
            ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
            : "bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20"
        } disabled:opacity-60`}
      >
        {isInCart ? "Added to cart" : addingToCart ? "Adding..." : "Add to cart"}
      </button>
      {error && (
        <p className="mt-2 text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}
