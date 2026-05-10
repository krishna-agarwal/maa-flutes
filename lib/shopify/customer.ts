import { CUSTOMER_CREATE, CUSTOMER_ACCESS_TOKEN_CREATE } from "./queries";

const SHOPIFY_CUSTOMER_TOKEN_COOKIE = "shopify_customer_token";
const SHOPIFY_API_VERSION = "2024-10";

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
    throw new Error(json.errors[0].message);
  }
  return json.data as T;
}

/**
 * Create a Shopify customer account.
 * Silently ignores "already exists" errors (the customer was created on a prior registration).
 */
export async function createShopifyCustomer(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<void> {
  const data = await storefrontFetch<{
    customerCreate: {
      customer: { id: string; email: string } | null;
      customerUserErrors: { code: string; message: string }[];
    };
  }>(CUSTOMER_CREATE, {
    input: { email, password, firstName, lastName },
  });

  const errors = data.customerCreate.customerUserErrors;
  if (errors.length > 0 && errors[0].code !== "TAKEN") {
    throw new Error(errors[0].message);
  }
}

/**
 * Get a Shopify customer access token and store it in a cookie.
 */
export async function loginShopifyCustomer(
  email: string,
  password: string
): Promise<string | null> {
  try {
    const data = await storefrontFetch<{
      customerAccessTokenCreate: {
        customerAccessToken: {
          accessToken: string;
          expiresAt: string;
        } | null;
        customerUserErrors: { code: string; message: string }[];
      };
    }>(CUSTOMER_ACCESS_TOKEN_CREATE, {
      input: { email, password },
    });

    const token =
      data.customerAccessTokenCreate.customerAccessToken?.accessToken ?? null;

    if (token) {
      setShopifyCustomerTokenCookie(token);
    }

    return token;
  } catch {
    // Don't block the main auth flow if Shopify customer login fails
    return null;
  }
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

export function getShopifyCustomerTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(SHOPIFY_CUSTOMER_TOKEN_COOKIE + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function setShopifyCustomerTokenCookie(token: string) {
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  document.cookie = `${SHOPIFY_CUSTOMER_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearShopifyCustomerTokenCookie() {
  document.cookie = `${SHOPIFY_CUSTOMER_TOKEN_COOKIE}=; path=/; max-age=0`;
}
