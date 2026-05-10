"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useCart } from "@/app/context/cart";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cart, cartCount, updateItem, removeItem, getCheckoutUrl } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const lines = cart?.lines?.edges ?? [];
  const subtotal = cart?.cost?.subtotalAmount;

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const freshCheckoutUrl = await getCheckoutUrl();
      if (freshCheckoutUrl) {
        window.location.href = freshCheckoutUrl;
      } else {
        setCheckoutLoading(false);
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">
            Your Cart
            {cartCount > 0 && (
              <span className="ml-2 text-sm font-normal text-stone-400">
                ({cartCount} {cartCount === 1 ? "item" : "items"})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-stone-50 flex items-center justify-center text-4xl">
                🪈
              </div>
              <div>
                <p className="text-stone-900 font-medium text-lg">Your cart is empty</p>
                <p className="text-stone-400 text-sm mt-1">Add some flutes to get started</p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors mt-2"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-5">
              {lines.map(({ node: line }) => {
                const { merchandise } = line;
                const image = merchandise.image;
                const price = line.cost.totalAmount;

                return (
                  <li key={line.id} className="flex gap-4 pb-5 border-b border-stone-50 last:border-0">
                    {image && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-50 flex-shrink-0 border border-stone-100">
                        <Image
                          src={image.url}
                          alt={image.altText ?? merchandise.product.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 truncate text-sm">
                        {merchandise.product.title}
                      </p>
                      {merchandise.title !== "Default Title" && (
                        <p className="text-xs text-stone-400 mt-0.5">
                          {merchandise.title}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-stone-900 mt-1.5">
                        {formatMoney(price)}
                      </p>

                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex items-center border border-stone-200 rounded-lg">
                          <button
                            onClick={() =>
                              updateItem(line.id, line.quantity - 1)
                            }
                            className="px-2.5 py-1 text-stone-400 hover:text-stone-900 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="px-3 text-sm font-medium text-stone-700">
                            {line.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateItem(line.id, line.quantity + 1)
                            }
                            className="px-2.5 py-1 text-stone-400 hover:text-stone-900 transition-colors"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(line.id)}
                          className="text-xs text-stone-400 hover:text-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="px-6 py-5 border-t border-stone-100 space-y-4 bg-stone-50/50">
            {subtotal && (
              <div className="flex justify-between text-base font-semibold text-stone-900">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
            )}
            <p className="text-xs text-stone-400">
              Taxes and shipping calculated at checkout.
            </p>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || !cart}
              className="block w-full py-3.5 text-center bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white disabled:text-stone-400 font-semibold rounded-xl transition-colors shadow-lg shadow-stone-900/10 disabled:shadow-none"
            >
              {checkoutLoading ? "Redirecting..." : "Checkout"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function formatMoney(amount: { amount: string; currencyCode: string }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: amount.currencyCode,
    minimumFractionDigits: 0,
  }).format(Number(amount.amount));
}
