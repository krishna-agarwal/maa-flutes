// Client-side Shopify Storefront API utilities

const SHOPIFY_API_VERSION = "2024-10";

export async function createCheckoutCart(variantId: string): Promise<string | null> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors { field message }
      }
    }
  `;

  try {
    const res = await fetch(
      `https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token!,
        },
        body: JSON.stringify({
          query,
          variables: {
            input: {
              lines: [{ merchandiseId: variantId, quantity: 1 }],
            },
          },
        }),
      }
    );

    const json = await res.json();
    if (json.errors?.length) {
      console.error("GraphQL Error:", json.errors);
      return null;
    }
    if (json.data?.cartCreate?.userErrors?.length) {
      console.error("Cart errors:", json.data.cartCreate.userErrors);
      return null;
    }
    return json.data?.cartCreate?.cart?.checkoutUrl ?? null;
  } catch (error) {
    console.error("Failed to create checkout cart:", error);
    return null;
  }
}
