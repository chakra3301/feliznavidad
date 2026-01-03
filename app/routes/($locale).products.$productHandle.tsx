import {useRef, Suspense, useState} from 'react';
import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, Await, Link} from '@remix-run/react';
import {
  getSeoMeta,
  Money,
  ShopPayButton,
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  getProductOptions,
  type MappedProductOptions,
  Image,
} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import clsx from 'clsx';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';

import type {ProductFragment} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/AddToCartButton';
import {seoPayload} from '~/lib/seo.server';
import type {Storefront} from '~/lib/type';
import {routeHeaders} from '~/data/cache';
import {MEDIA_FRAGMENT, PRODUCT_CARD_FRAGMENT} from '~/data/fragments';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {productHandle} = args.params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

async function loadCriticalData({
  params,
  request,
  context,
}: LoaderFunctionArgs) {
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  const selectedOptions = getSelectedProductOptions(request);

  const [{shop, product}] = await Promise.all([
    context.storefront.query(PRODUCT_QUERY, {
      variables: {
        handle: productHandle,
        selectedOptions,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
  ]);

  if (!product?.id) {
    throw new Response('product', {status: 404});
  }

  const recommended = getRecommendedProducts(context.storefront, product.id);
  const selectedVariant = product.selectedOrFirstAvailableVariant ?? {};
  const variants = getAdjacentAndFirstAvailableVariants(product);

  const seo = seoPayload.product({
    product: {...product, variants},
    selectedVariant,
    url: request.url,
  });

  return {
    product,
    variants,
    shop,
    storeDomain: shop.primaryDomain.url,
    recommended,
    seo,
  };
}

function loadDeferredData(args: LoaderFunctionArgs) {
  return {};
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Product() {
  const {product, shop, recommended, variants, storeDomain} =
    useLoaderData<typeof loader>();
  const {media, title, vendor, descriptionHtml} = product;
  const {shippingPolicy, refundPolicy} = shop;

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    variants,
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <Link to="/" className="hover:text-violet-600 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/collections/all" className="hover:text-violet-600 transition-colors">Products</Link>
            <span>/</span>
            <span className="text-neutral-700">{title}</span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Product Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-[3/4] bg-neutral-100 overflow-hidden relative group">
                {media.nodes[selectedImage] && (
                  <Image
                    data={media.nodes[selectedImage].previewImage || media.nodes[selectedImage]}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                )}
                
                {/* Image navigation arrows */}
                {media.nodes.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev === 0 ? media.nodes.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/20 text-neutral-900"
                      aria-label="Previous image"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev === media.nodes.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/20 text-neutral-900"
                      aria-label="Next image"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnail gallery */}
              {media.nodes.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {media.nodes.slice(0, 8).map((image: any, i: number) => (
                    <button
                      key={image.id || i}
                      onClick={() => setSelectedImage(i)}
                      className={clsx(
                        'aspect-square bg-neutral-100 overflow-hidden transition-all duration-300',
                        selectedImage === i 
                          ? 'ring-2 ring-violet-500' 
                          : 'ring-1 ring-transparent hover:ring-neutral-300'
                      )}
                    >
                      <Image
                        data={image.previewImage || image}
                        className="w-full h-full object-cover"
                        sizes="100px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:sticky lg:top-28 lg:self-start space-y-8">
              {/* Header */}
              <div className="space-y-4">
                {vendor && (
                  <span className="text-xs tracking-[0.3em] uppercase text-violet-600/80">
                    {vendor}
                  </span>
                )}
                <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight text-neutral-900">
                  {title}
                </h1>
                <div className="flex items-baseline gap-4">
                  <Money
                    data={selectedVariant.price}
                    className="text-2xl font-medium text-neutral-900"
                  />
                  {selectedVariant.compareAtPrice && (
                    <Money
                      data={selectedVariant.compareAtPrice}
                      className="text-lg text-neutral-400 line-through"
                    />
                  )}
                  {selectedVariant.compareAtPrice && (
                    <span className="text-xs tracking-wider uppercase px-2 py-1 bg-violet-100 text-violet-600">
                      Sale
                    </span>
                  )}
                </div>
              </div>

              {/* Variant Selector */}
              <ProductForm
                productOptions={productOptions}
                selectedVariant={selectedVariant}
                storeDomain={storeDomain}
              />

              {/* Product Details Accordion */}
              <div className="space-y-4 pt-8 border-t border-neutral-200">
                {descriptionHtml && (
                  <ProductAccordion title="Description" defaultOpen>
                    <div
                      className="prose prose-sm max-w-none text-neutral-600"
                      dangerouslySetInnerHTML={{__html: descriptionHtml}}
                    />
                  </ProductAccordion>
                )}
                
                {shippingPolicy?.body && (
                  <ProductAccordion title="Shipping">
                    <div className="text-sm text-neutral-500 space-y-2">
                      <p>Free shipping on orders over $150</p>
                      <p>Standard delivery: 5-7 business days</p>
                      <p>Express delivery: 2-3 business days</p>
                      <Link 
                        to={`/policies/${shippingPolicy.handle}`}
                        className="text-violet-600 hover:text-violet-500 transition-colors inline-flex items-center gap-1"
                      >
                        Learn more
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </ProductAccordion>
                )}

                {refundPolicy?.body && (
                  <ProductAccordion title="Returns">
                    <div className="text-sm text-neutral-500 space-y-2">
                      <p>30-day return policy on all items</p>
                      <p>Items must be unworn with original tags</p>
                      <Link 
                        to={`/policies/${refundPolicy.handle}`}
                        className="text-violet-600 hover:text-violet-500 transition-colors inline-flex items-center gap-1"
                      >
                        Learn more
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </ProductAccordion>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 pt-6 text-xs text-neutral-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <span>Free shipping over $150</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span>30-day returns</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        <Suspense fallback={null}>
          <Await
            errorElement={null}
            resolve={recommended}
          >
            {(products) => products?.nodes?.length > 0 && (
              <section className="border-t border-neutral-200 py-24 px-6 bg-neutral-50">
                <div className="max-w-7xl mx-auto">
                  <h2 className="font-serif text-3xl md:text-4xl mb-12 text-neutral-900">You May Also Like</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200">
                    {products.nodes.slice(0, 4).map((product: any) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.handle}`}
                        className="group bg-white block"
                      >
                        <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
                          {product.featuredImage && (
                            <Image
                              data={product.featuredImage}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              sizes="(min-width: 1024px) 25vw, 50vw"
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-neutral-900">{product.title}</h3>
                          {product.variants?.nodes?.[0]?.price && (
                            <Money
                              data={product.variants.nodes[0].price}
                              className="text-sm text-neutral-500 mt-1"
                            />
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </Await>
        </Suspense>
      </div>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </>
  );
}

function ProductAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-200 pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-left"
      >
        <span className="text-sm tracking-wider uppercase text-neutral-900">{title}</span>
        <svg
          className={clsx(
            'w-4 h-4 transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 pt-4' : 'max-h-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ProductForm({
  productOptions,
  selectedVariant,
  storeDomain,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  storeDomain: string;
}) {
  const isOutOfStock = !selectedVariant?.availableForSale;

  const isOnSale =
    selectedVariant?.price?.amount &&
    selectedVariant?.compareAtPrice?.amount &&
    selectedVariant?.price?.amount < selectedVariant?.compareAtPrice?.amount;

  return (
    <div className="space-y-8">
      {/* Variant Options */}
      <div className="space-y-6">
        {productOptions.map((option) => (
          <div key={option.name} className="space-y-3">
            <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 block">
              {option.name}
              {option.optionValues.find(v => v.selected) && (
                <span className="text-neutral-900 ml-2">
                  — {option.optionValues.find(v => v.selected)?.name}
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {option.optionValues.map(
                ({
                  isDifferentProduct,
                  name,
                  variantUriQuery,
                  handle,
                  selected,
                  available,
                  swatch,
                }) => (
                  <Link
                    key={option.name + name}
                    {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                    to={`/products/${handle}?${variantUriQuery}`}
                    preventScrollReset
                    prefetch="intent"
                    replace
                    className={clsx(
                      'min-w-[3rem] px-4 py-3 text-sm tracking-wider uppercase border transition-all duration-300',
                      selected
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-transparent text-neutral-700 border-neutral-300 hover:border-violet-600 hover:text-violet-600',
                      !available && 'opacity-30 cursor-not-allowed relative',
                    )}
                  >
                    {swatch ? (
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    ) : (
                      name
                    )}
                    {!available && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-full h-px bg-neutral-400 rotate-[-20deg]" />
                      </span>
                    )}
                  </Link>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add to Cart Section */}
      {selectedVariant && (
        <div className="space-y-4">
          {isOutOfStock ? (
            <button
              disabled
              className="w-full py-4 bg-neutral-200 text-neutral-400 text-sm tracking-[0.2em] uppercase cursor-not-allowed"
            >
              Sold Out
            </button>
          ) : (
            <AddToCartButton
              lines={[
                {
                  merchandiseId: selectedVariant.id!,
                  quantity: 1,
                },
              ]}
              variant="primary"
              data-test="add-to-cart"
              className="w-full py-4 bg-white text-black text-sm tracking-[0.2em] uppercase font-medium hover:bg-brand-400 transition-all duration-500"
            >
              <span className="flex items-center justify-center gap-3">
                <span>Add to Cart</span>
                <span className="text-neutral-500">—</span>
                <Money
                  withoutTrailingZeros
                  data={selectedVariant?.price!}
                  as="span"
                />
                {isOnSale && (
                  <Money
                    withoutTrailingZeros
                    data={selectedVariant?.compareAtPrice!}
                    as="span"
                    className="opacity-50 line-through"
                  />
                )}
              </span>
            </AddToCartButton>
          )}
          
          {!isOutOfStock && (
            <ShopPayButton
              width="100%"
              variantIds={[selectedVariant?.id!]}
              storeDomain={storeDomain}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return <>{name}</>;

  return (
    <div
      aria-label={name}
      className="w-6 h-6 rounded-full border border-neutral-600"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} className="w-full h-full object-cover rounded-full" />}
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    availableForSale
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
    media(first: 10) {
      nodes {
        ...Media
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
    shop {
      name
      primaryDomain {
        url
      }
      shippingPolicy {
        body
        handle
      }
      refundPolicy {
        body
        handle
      }
    }
  }
  ${MEDIA_FRAGMENT}
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query productRecommendations(
    $productId: ID!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    recommended: productRecommendations(productId: $productId) {
      ...ProductCard
    }
    additional: products(first: $count, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

async function getRecommendedProducts(
  storefront: Storefront,
  productId: string,
) {
  const products = await storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
    variables: {productId, count: 12},
  });

  invariant(products, 'No data returned from Shopify API');

  const mergedProducts = (products.recommended ?? [])
    .concat(products.additional.nodes)
    .filter(
      (value, index, array) =>
        array.findIndex((value2) => value2.id === value.id) === index,
    );

  const originalProduct = mergedProducts.findIndex(
    (item) => item.id === productId,
  );

  mergedProducts.splice(originalProduct, 1);

  return {nodes: mergedProducts};
}
