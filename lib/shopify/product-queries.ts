import { ShopifyProduct } from "./types";

const SHOPIFY_API_VERSION = "2024-10";

const PRODUCT_CARD_FRAGMENT = `
  id
  handle
  title
  vendor
  tags
  availableForSale
  featuredImage {
    url
    altText
    width
    height
  }
  images(first: 5) {
    edges {
      node {
        url
        altText
        width
        height
      }
    }
  }
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
  }
  compareAtPriceRange {
    minVariantPrice {
      amount
      currencyCode
    }
  }
  variants(first: 1) {
    edges {
      node {
        id
        availableForSale
      }
    }
  }
`;

export async function fetchProductByScale(
  scale: string
): Promise<ShopifyProduct | null> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    console.error("Shopify credentials not configured");
    return null;
  }

  const query = `
    query GetProductsByScale($query: String, $first: Int = 5) {
      products(first: $first, query: $query) {
        edges {
          node {
            ${PRODUCT_CARD_FRAGMENT}
          }
        }
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
          "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({
          query,
          variables: {
            query: `title:"${scale}" OR tag:"${scale.toLowerCase()}"`,
            first: 10,
          },
        }),
      }
    );

    const json = await res.json();

    if (json.errors?.length) {
      console.error("GraphQL Error:", json.errors);
      return null;
    }

    const products = json.data?.products?.edges ?? [];

    if (products.length === 0) {
      return null;
    }

    // Filter to find the most relevant product by exact scale match
    const exactMatch = products.find((p: any) =>
      p.node.title.includes(`${scale} `) || p.node.title.endsWith(` ${scale}`) || p.node.title === scale
    );

    if (exactMatch) {
      return exactMatch.node as ShopifyProduct;
    }

    // If no exact match, try to find a product that contains the scale but not a variant (e.g., exclude C# when looking for C)
    const bestMatch = products.find((p: any) => {
      const title = p.node.title.toLowerCase();
      const scaleLower = scale.toLowerCase();
      // Match if scale appears as a word boundary, not as part of another note
      return new RegExp(`\\b${scaleLower}\\b`, "i").test(title);
    });

    return (bestMatch?.node as ShopifyProduct) || (products[0].node as ShopifyProduct);
  } catch (error) {
    console.error("Failed to fetch product by scale:", error);
    return null;
  }
}
