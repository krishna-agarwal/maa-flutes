"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { ShopifyCart } from "@/lib/shopify/types";
import {
  CART_CREATE,
  CART_ADD_LINES,
  CART_UPDATE_LINES,
  CART_REMOVE_LINES,
  GET_CART,
  CART_BUYER_IDENTITY_UPDATE,
} from "@/lib/shopify/queries";
import { getShopifyCustomerTokenCookie } from "@/lib/shopify/customer";
import { createClient } from "@/lib/supabase/client";

const CART_ID_COOKIE = "shopify_cart_id";
const SHOPIFY_API_VERSION = "2024-10";

// ─── Cookie helpers ────────────────────────────────────────────────────────────

function getCartIdCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(CART_ID_COOKIE + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function setCartIdCookie(id: string) {
  const maxAge = 60 * 60 * 24; // 1 day (prevents reusing stale carts with old cached prices)
  document.cookie = `${CART_ID_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

// ─── Storefront fetch (client-side, uses NEXT_PUBLIC_ vars) ───────────────────

async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  const res = await fetch(
    `https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token!,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const json = await res.json();
  if (json.errors?.length) {
    console.error("GraphQL Error:", json.errors);
    throw new Error(json.errors[0].message);
  }
  return json.data as T;
}

// ─── Context types ─────────────────────────────────────────────────────────────

interface CartContextValue {
  cart: ShopifyCart | null;
  cartCount: number;
  loading: boolean;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  getCheckoutUrl: () => Promise<string | null>;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [loading, setLoading] = useState(false);

  // On mount: rehydrate cart from cookie
  useEffect(() => {
    const cartId = getCartIdCookie();
    if (!cartId) return;

    let isMounted = true;
    storefrontFetch<{ cart: ShopifyCart | null }>(GET_CART, { cartId })
      .then(({ cart }) => {
        if (isMounted && cart) setCart(cart);
      })
      .catch(() => {
        // Cart may have expired — clear the cookie
        if (isMounted) {
          document.cookie = `${CART_ID_COOKIE}=; path=/; max-age=0`;
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync buyer identity when user is logged in and cart exists
  useEffect(() => {
    const cartId = getCartIdCookie();
    if (!cartId || !cart) return;

    const customerAccessToken = getShopifyCustomerTokenCookie();
    if (!customerAccessToken) {
      // Fall back to email-only buyer identity from Supabase session
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user?.email) return;
        storefrontFetch<{ cartBuyerIdentityUpdate: { cart: ShopifyCart } }>(
          CART_BUYER_IDENTITY_UPDATE,
          { cartId, buyerIdentity: { email: user.email } }
        )
          .then(({ cartBuyerIdentityUpdate }) =>
            setCart(cartBuyerIdentityUpdate.cart)
          )
          .catch(() => {});
      });
      return;
    }

    storefrontFetch<{ cartBuyerIdentityUpdate: { cart: ShopifyCart } }>(
      CART_BUYER_IDENTITY_UPDATE,
      { cartId, buyerIdentity: { customerAccessToken } }
    )
      .then(({ cartBuyerIdentityUpdate }) =>
        setCart(cartBuyerIdentityUpdate.cart)
      )
      .catch(() => {});
  }, [cart?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cartCount = cart?.totalQuantity ?? 0;

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setLoading(true);
      try {
        let existingCartId = getCartIdCookie();

        if (existingCartId) {
          try {
            // Try to add to existing cart
            const data = await storefrontFetch<{
              cartLinesAdd: { cart: ShopifyCart; userErrors: Array<{ field?: string; message: string }> };
            }>(CART_ADD_LINES, {
              cartId: existingCartId,
              lines: [{ merchandiseId: variantId, quantity }],
            });
            if (data.cartLinesAdd.userErrors?.length) {
              console.error("Cart add lines errors:", data.cartLinesAdd.userErrors);
              throw new Error(data.cartLinesAdd.userErrors[0].message);
            }
            // Check if the item was actually added (totalQuantity should be >= quantity)
            if (data.cartLinesAdd.cart.totalQuantity >= quantity) {
              console.log("Item added to existing cart:", { cartId: existingCartId, totalQuantity: data.cartLinesAdd.cart.totalQuantity });
              setCart(data.cartLinesAdd.cart);
              return;
            } else {
              console.warn("Cart returned 0 items after add - cart may be corrupted, creating new one");
              throw new Error("The specified cart does not exist or is corrupted");
            }
          } catch (error) {
            // If cart doesn't exist, clear the cookie and create a new one
            const errorMessage = error instanceof Error ? error.message.toLowerCase() : "";
            if (errorMessage.includes("cart") && errorMessage.includes("does not exist")) {
              console.warn("Existing cart expired, creating new one", error);
              document.cookie = `${CART_ID_COOKIE}=; path=/; max-age=0`;
              existingCartId = null;
            } else {
              console.error("Cart error details:", { error, errorMessage });
              throw error;
            }
          }
        }

        // Create new cart
        console.log("Creating new cart with variantId:", variantId, "quantity:", quantity);
        const data = await storefrontFetch<{
          cartCreate: { cart: ShopifyCart; userErrors: Array<{ field?: string; message: string }> };
        }>(CART_CREATE, {
          input: { lines: [{ merchandiseId: variantId, quantity }] },
        });
        if (data.cartCreate.userErrors?.length) {
          console.error("Cart create errors:", data.cartCreate.userErrors);
          throw new Error(data.cartCreate.userErrors[0].message);
        }
        const newCart = data.cartCreate.cart;
        console.log("New cart created:", { cartId: newCart.id, totalQuantity: newCart.totalQuantity, lineCount: newCart.lines.edges.length });
        setCart(newCart);
        setCartIdCookie(newCart.id);
      } catch (error) {
        console.error("Add to cart error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateItem = useCallback(
    async (lineId: string, quantity: number) => {
      const cartId = getCartIdCookie();
      if (!cartId) return;

      if (quantity <= 0) {
        return removeItem(lineId);
      }

      setLoading(true);
      try {
        const data = await storefrontFetch<{
          cartLinesUpdate: { cart: ShopifyCart };
        }>(CART_UPDATE_LINES, {
          cartId,
          lines: [{ id: lineId, quantity }],
        });
        setCart(data.cartLinesUpdate.cart);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const removeItem = useCallback(async (lineId: string) => {
    const cartId = getCartIdCookie();
    if (!cartId) return;

    setLoading(true);
    try {
      const data = await storefrontFetch<{
        cartLinesRemove: { cart: ShopifyCart };
      }>(CART_REMOVE_LINES, { cartId, lineIds: [lineId] });
      setCart(data.cartLinesRemove.cart);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create brand new cart with current prices to avoid Razorpay total mismatch
  // Razorpay validates order total at payment time — if cart is old, Shopify has stale prices cached
  const getCheckoutUrl = useCallback(async (): Promise<string | null> => {
    const cartId = getCartIdCookie();
    if (!cartId) return null;

    try {
      // Step 1: Fetch current cart to get the line items
      const currentCartData = await storefrontFetch<{ cart: ShopifyCart | null }>(
        GET_CART,
        { cartId }
      );

      if (!currentCartData.cart || currentCartData.cart.lines.edges.length === 0) {
        return null;
      }

      // Step 2: Extract current items from the cart
      const currentItems = currentCartData.cart.lines.edges.map(({ node }) => ({
        merchandiseId: node.merchandise.id,
        quantity: node.quantity,
      }));

      // Step 3: Create a BRAND NEW cart with the same items
      // This forces Shopify to recalculate prices with current product data
      const newCartData = await storefrontFetch<{
        cartCreate: { cart: ShopifyCart; userErrors: Array<{ field?: string; message: string }> };
      }>(CART_CREATE, {
        input: { lines: currentItems },
      });

      if (newCartData.cartCreate.userErrors?.length) {
        console.error("Failed to create fresh cart:", newCartData.cartCreate.userErrors);
        return null;
      }

      const newCart = newCartData.cartCreate.cart;

      // Step 4: Update the cookie with the new cart ID
      setCartIdCookie(newCart.id);
      setCart(newCart);

      return newCart.checkoutUrl;
    } catch (error) {
      console.error("Failed to get fresh checkout URL:", error);
    }
    return null;
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, cartCount, loading, addItem, updateItem, removeItem, getCheckoutUrl }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
