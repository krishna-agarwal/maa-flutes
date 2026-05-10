// Reusable fragments
const IMAGE_FRAGMENT = `
  url
  altText
  width
  height
`;

const MONEY_FRAGMENT = `
  amount
  currencyCode
`;

const PRODUCT_CARD_FRAGMENT = `
  id
  handle
  title
  availableForSale
  featuredImage { ${IMAGE_FRAGMENT} }
  priceRange {
    minVariantPrice { ${MONEY_FRAGMENT} }
  }
  compareAtPriceRange {
    minVariantPrice { ${MONEY_FRAGMENT} }
  }
`;

// Products
export const GET_PRODUCTS = `
  query GetProducts($first: Int = 24) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          ${PRODUCT_CARD_FRAGMENT}
        }
      }
    }
  }
`;

export const GET_PRODUCT = `
  query GetProduct($handle: String!) {
    productByHandle(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      vendor
      tags
      availableForSale
      featuredImage { ${IMAGE_FRAGMENT} }
      images(first: 10) {
        edges { node { ${IMAGE_FRAGMENT} } }
      }
      priceRange {
        minVariantPrice { ${MONEY_FRAGMENT} }
        maxVariantPrice { ${MONEY_FRAGMENT} }
      }
      compareAtPriceRange {
        minVariantPrice { ${MONEY_FRAGMENT} }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            availableForSale
            price { ${MONEY_FRAGMENT} }
            compareAtPrice { ${MONEY_FRAGMENT} }
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

// Collections
export const GET_COLLECTIONS = `
  query GetCollections($first: Int = 12) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          image { ${IMAGE_FRAGMENT} }
        }
      }
    }
  }
`;

export const GET_COLLECTION = `
  query GetCollection($handle: String!, $productsFirst: Int = 24) {
    collectionByHandle(handle: $handle) {
      id
      handle
      title
      description
      image { ${IMAGE_FRAGMENT} }
      products(first: $productsFirst) {
        edges {
          node {
            ${PRODUCT_CARD_FRAGMENT}
          }
        }
      }
    }
  }
`;

// Cart fragments
const CART_LINE_FRAGMENT = `
  id
  quantity
  cost {
    totalAmount { ${MONEY_FRAGMENT} }
  }
  merchandise {
    ... on ProductVariant {
      id
      title
      image { ${IMAGE_FRAGMENT} }
      product {
        title
        handle
      }
    }
  }
`;

const CART_FRAGMENT = `
  id
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount { ${MONEY_FRAGMENT} }
    totalAmount { ${MONEY_FRAGMENT} }
    totalTaxAmount { ${MONEY_FRAGMENT} }
  }
  lines(first: 100) {
    edges { node { ${CART_LINE_FRAGMENT} } }
  }
`;

export const CART_CREATE = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { ${CART_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

export const CART_ADD_LINES = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ${CART_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

export const CART_UPDATE_LINES = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ${CART_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

export const CART_REMOVE_LINES = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ${CART_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

export const GET_CART = `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) { ${CART_FRAGMENT} }
  }
`;

// Cart buyer identity
export const CART_BUYER_IDENTITY_UPDATE = `
  mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart { ${CART_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

// Shopify customer mutations
export const CUSTOMER_CREATE = `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer { id email }
      customerUserErrors { field message code }
    }
  }
`;

export const CUSTOMER_ACCESS_TOKEN_CREATE = `
  mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors { field message code }
    }
  }
`;
