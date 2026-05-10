const SHOPIFY_API_VERSION = "2024-10";

function getEndpoint() {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  return `https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

function getToken() {
  return process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;
}

interface ShopifyFetchOptions<TVariables> {
  query: string;
  variables?: TVariables;
  tags?: string[];
}

export async function shopifyFetch<TData, TVariables = Record<string, unknown>>({
  query,
  variables,
}: ShopifyFetchOptions<TVariables>): Promise<TData> {
  const res = await fetch(getEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": getToken(),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(
      `Shopify fetch failed: ${res.status} ${res.statusText}`
    );
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(
      `Shopify GraphQL error: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`
    );
  }

  return json.data as TData;
}
