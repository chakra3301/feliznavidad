import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Suspense} from 'react';
import {Await, useLoaderData, Link} from '@remix-run/react';
import {getSeoMeta, Image, Money} from '@shopify/hydrogen';

import {MEDIA_FRAGMENT, PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {params, context} = args;
  const {language, country} = context.storefront.i18n;

  if (
    params.locale &&
    params.locale.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    throw new Response(null, {status: 404});
  }

  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

async function loadCriticalData({context, request}: LoaderFunctionArgs) {
  const [{shop}] = await Promise.all([
    context.storefront.query(HOMEPAGE_SEO_QUERY),
  ]);

  return {
    shop,
    seo: seoPayload.home({url: request.url}),
  };
}

function loadDeferredData({context}: LoaderFunctionArgs) {
  const {language, country} = context.storefront.i18n;

  const featuredProducts = context.storefront
    .query(HOMEPAGE_FEATURED_PRODUCTS_QUERY, {
      variables: {country, language},
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

  const featuredCollections = context.storefront
    .query(FEATURED_COLLECTIONS_QUERY, {
      variables: {country, language},
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

  return {
    featuredProducts,
    featuredCollections,
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Homepage() {
  const {featuredProducts, featuredCollections} = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-neutral-50 to-white">
        {/* Background layers - soft gradients for light theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100/60 via-transparent to-rose-100/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(244,63,94,0.08),transparent_50%)]" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-60" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-400/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-400/20 rounded-full blur-[120px] animate-float" style={{animationDelay: '-3s'}} />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.5em] uppercase text-violet-600/80 mb-8 font-medium animate-fade-up" style={{animationDelay: '0.1s'}}>
            Collection 2026
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal leading-[0.95] mb-8 text-neutral-900 animate-fade-up" style={{animationDelay: '0.2s'}}>
            <span className="block">Wear the</span>
            <span className="block italic text-gradient">
              Future
            </span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-500 max-w-xl mx-auto mb-12 font-light leading-relaxed animate-fade-up" style={{animationDelay: '0.3s'}}>
            Experimental silhouettes. Sustainable materials. 
            Designed for those who move differently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{animationDelay: '0.4s'}}>
            <Link
              to="/collections/all"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-neutral-900 text-white text-sm tracking-[0.2em] uppercase font-medium hover:bg-violet-600 transition-all duration-500"
            >
              <span>Shop Collection</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/collections"
              className="inline-flex items-center gap-3 px-8 py-4 border border-neutral-300 text-neutral-900 text-sm tracking-[0.2em] uppercase font-medium hover:border-violet-600 hover:text-violet-600 transition-all duration-500"
            >
              <span>View All</span>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <span className="text-[10px] tracking-[0.4em] uppercase text-neutral-400">Scroll</span>
          <div className="w-px h-16 bg-gradient-to-b from-neutral-400 to-transparent" />
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts && (
        <Suspense fallback={<ProductGridSkeleton />}>
          <Await resolve={featuredProducts}>
            {(response) => {
              if (!response?.products?.nodes?.length) return null;
              return (
                <section className="py-24 px-6 bg-white">
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-end justify-between mb-16">
                      <div>
                        <span className="text-xs tracking-[0.4em] uppercase text-violet-600/80 block mb-3">Featured</span>
                        <h2 className="font-serif text-4xl md:text-5xl text-neutral-900">New Arrivals</h2>
                      </div>
                      <Link 
                        to="/collections/all" 
                        className="hidden md:flex items-center gap-2 text-sm tracking-wider uppercase text-neutral-500 hover:text-violet-600 transition-colors group"
                      >
                        <span>View All</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200">
                      {response.products.nodes.slice(0, 6).map((product: any, index: number) => (
                        <ProductCard key={product.id} product={product} index={index} />
                      ))}
                    </div>

                    <div className="mt-8 flex justify-center md:hidden">
                      <Link 
                        to="/collections/all" 
                        className="btn-secondary"
                      >
                        View All Products
                      </Link>
                    </div>
                  </div>
                </section>
              );
            }}
          </Await>
        </Suspense>
      )}

      {/* Collections Strip */}
      {featuredCollections && (
        <Suspense fallback={<div className="h-64 bg-neutral-100" />}>
          <Await resolve={featuredCollections}>
            {(response) => {
              if (!response?.collections?.nodes?.length) return null;
              return (
                <section className="border-y border-neutral-200">
                  <div className="flex overflow-x-auto scrollbar-hide">
                    {response.collections.nodes.map((collection: any) => (
                      <Link
                        key={collection.id}
                        to={`/collections/${collection.handle}`}
                        className="group flex-shrink-0 w-80 h-72 relative overflow-hidden"
                      >
                        {collection.image && (
                          <Image
                            data={collection.image}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="320px"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/50 transition-colors duration-500" />
                        <div className="absolute inset-0 flex flex-col items-center justify-end p-6 pb-8 text-white">
                          <span className="text-xl tracking-[0.15em] uppercase font-medium">{collection.title}</span>
                          <span className="text-xs text-white/70 tracking-wider mt-2 group-hover:text-white transition-colors">
                            Explore →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            }}
          </Await>
        </Suspense>
      )}

      {/* Marquee Banner */}
      <div className="py-5 bg-gradient-to-r from-violet-600 to-rose-500 overflow-hidden text-white">
        <div className="animate-marquee flex gap-16 whitespace-nowrap">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-sm tracking-[0.3em] uppercase font-medium flex items-center gap-16">
              <span>Free Shipping Over $150</span>
              <span className="w-2 h-2 bg-white/40 rounded-full" />
              <span>Sustainable Materials</span>
              <span className="w-2 h-2 bg-white/40 rounded-full" />
              <span>Made to Order</span>
              <span className="w-2 h-2 bg-white/40 rounded-full" />
            </span>
          ))}
        </div>
      </div>

      {/* About Section */}
      <section className="py-32 px-6 relative overflow-hidden bg-gradient-to-b from-white to-neutral-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.06),transparent_70%)]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="text-xs tracking-[0.4em] uppercase text-violet-600/80 block mb-6">Our Philosophy</span>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-8 text-neutral-900">
            We believe clothing should be an extension of your identity, not a uniform.
          </h2>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            Each piece is crafted with intention, using only sustainable materials and ethical production methods. 
            Because looking good should never come at the cost of our planet.
          </p>
          <Link
            to="/pages/about"
            className="inline-flex items-center gap-2 text-sm tracking-wider uppercase text-neutral-600 hover:text-violet-600 transition-colors border-b border-neutral-300 pb-1 hover:border-violet-600"
          >
            Learn More About Us
          </Link>
        </div>
      </section>
    </div>
  );
}

function ProductCard({product, index}: {product: any; index: number}) {
  const firstVariant = product.variants?.nodes?.[0];
  const image = product.featuredImage;

  return (
    <Link
      to={`/products/${product.handle}`}
      className="group relative bg-white overflow-hidden block"
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-neutral-100">
        {image && (
          <Image
            data={image}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Quick view button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          <span className="block w-full py-3 bg-neutral-900 text-white text-xs tracking-[0.2em] uppercase text-center hover:bg-violet-600 transition-colors">
            Quick View
          </span>
        </div>
      </div>

      <div className="p-5 space-y-2">
        <h3 className="text-sm tracking-wide font-medium text-neutral-900">{product.title}</h3>
        <div className="flex items-center gap-3">
          {firstVariant?.price && (
            <Money
              data={firstVariant.price}
              className="text-sm text-neutral-600"
            />
          )}
          {firstVariant?.compareAtPrice && (
            <Money
              data={firstVariant.compareAtPrice}
              className="text-xs text-neutral-400 line-through"
            />
          )}
        </div>
      </div>
    </Link>
  );
}

function ProductGridSkeleton() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <div className="h-4 w-24 bg-neutral-200 rounded mb-4" />
          <div className="h-12 w-48 bg-neutral-200 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white">
              <div className="aspect-[3/4] bg-neutral-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-3/4 bg-neutral-200 rounded" />
                <div className="h-4 w-1/4 bg-neutral-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const HOMEPAGE_SEO_QUERY = `#graphql
  query HomepageSeo($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      name
      description
    }
  }
` as const;

export const HOMEPAGE_FEATURED_PRODUCTS_QUERY = `#graphql
  query homepageFeaturedProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

export const FEATURED_COLLECTIONS_QUERY = `#graphql
  query homepageFeaturedCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 6, sortKey: UPDATED_AT) {
      nodes {
        id
        title
        handle
        image {
          altText
          width
          height
          url
        }
      }
    }
  }
` as const;
