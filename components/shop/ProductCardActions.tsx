"use client";

import { useState } from "react";
import { useCart } from "@/app/context/cart";
import { createCheckoutCart } from "@/lib/shopify/storefront-client";

interface ProductCardActionsProps {
  variantId: string | null;
  availableForSale: boolean;
}

export default function ProductCardActions({
  variantId,
  availableForSale,
}: ProductCardActionsProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    if (!variantId) {
      setError("Unable to add to cart");
      return;
    }

    setAddingToCart(true);
    try {
      await addItem(variantId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add to cart";
      setError(message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    if (!variantId) {
      setError("Unable to proceed");
      return;
    }

    setBuyingNow(true);
    try {
      // Create a fresh cart with only this product (don't touch user's existing cart)
      const checkoutUrl = await createCheckoutCart(variantId);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError("Could not access checkout");
        setBuyingNow(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to checkout";
      setError(message);
      setBuyingNow(false);
    }
  };

  if (!availableForSale || !variantId) {
    return (
      <button
        disabled
        className="w-full py-2 bg-stone-100 text-stone-400 font-medium rounded-lg cursor-not-allowed border border-stone-200 text-xs"
      >
        Sold out
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={handleAddToCart}
        disabled={addingToCart || buyingNow}
        className={`w-full py-2 font-semibold rounded-lg transition-all duration-200 text-xs tracking-wide cursor-pointer ${
          added
            ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
            : "bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {added ? "Added!" : addingToCart ? "Adding..." : "Add to cart"}
      </button>

      <button
        onClick={handleBuyNow}
        disabled={addingToCart || buyingNow}
        className="w-full text-center py-1 text-amber-600 hover:text-amber-700 hover:underline font-medium text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buyingNow ? "Loading..." : "Buy now"}
      </button>
      {error && <p className="mt-1 text-red-600 text-xs">{error}</p>}
    </div>
  );
}
