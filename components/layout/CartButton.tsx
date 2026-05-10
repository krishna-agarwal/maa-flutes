"use client";

import { useCart } from "@/app/context/cart";

interface CartButtonProps {
  onOpen: () => void;
}

export default function CartButton({ onOpen }: CartButtonProps) {
  const { cartCount } = useCart();

  return (
    <button
      onClick={onOpen}
      aria-label={`Cart (${cartCount} items)`}
      className="relative p-2 text-stone-700 hover:text-amber-700 transition-colors"
    >
      <BagIcon />
      {cartCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </button>
  );
}

function BagIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
