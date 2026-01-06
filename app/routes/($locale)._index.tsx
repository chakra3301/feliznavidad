import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, Link} from '@remix-run/react';
import {getSeoMeta, Image, Money, Pagination, getPaginationVariables} from '@shopify/hydrogen';

import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';

const PAGE_BY = 12;

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {params, context, request} = args;
  const {language, country} = context.storefront.i18n;

  if (
    params.locale &&
    params.locale.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    throw new Response(null, {status: 404});
  }

  const variables = getPaginationVariables(request, {pageBy: PAGE_BY});

  const criticalData = await loadCriticalData(args, variables);

  return defer({...criticalData});
}

async function loadCriticalData(
  {context, request}: LoaderFunctionArgs,
  variables: ReturnType<typeof getPaginationVariables>
) {
  const {language, country} = context.storefront.i18n;

  const [{shop}, {products}] = await Promise.all([
    context.storefront.query(HOMEPAGE_SEO_QUERY),
    context.storefront.query(ALL_PRODUCTS_QUERY, {
      variables: {
        ...variables,
        country,
        language,
      },
    }),
  ]);

  return {
    shop,
    products,
    seo: seoPayload.home({url: request.url}),
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Homepage() {
  const {products} = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <section className="pt-8 pb-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-xs tracking-[0.4em] uppercase text-violet-600/80 block mb-3">
            Shop
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-neutral-900 mb-4">
            All Products
          </h1>
          <p className="text-neutral-500 max-w-xl mx-auto">
            Browse our complete collection of products
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <Pagination connection={products}>
            {({nodes, isLoading, NextLink, PreviousLink, hasNextPage, hasPreviousPage}) => (
              <>
                {hasPreviousPage && (
                  <div className="flex justify-center mb-8">
                    <PreviousLink className="px-8 py-3 border border-neutral-300 text-neutral-700 text-sm tracking-[0.15em] uppercase hover:border-violet-500 hover:text-violet-600 transition-all">
                      {isLoading ? 'Loading...' : 'Load Previous'}
                    </PreviousLink>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-neutral-200">
                  {nodes.map((product: any, index: number) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>

                {hasNextPage && (
                  <div className="flex justify-center mt-12">
                    <NextLink className="px-8 py-3 bg-neutral-900 text-white text-sm tracking-[0.15em] uppercase hover:bg-violet-600 transition-all">
                      {isLoading ? 'Loading...' : 'Load More Products'}
                    </NextLink>
                  </div>
                )}
              </>
            )}
          </Pagination>
        </div>
      </section>
    </div>
  );
}

function ProductCard({product, index}: {product: any; index: number}) {
  const firstVariant = product.variants?.nodes?.[0];
  const image = product.featuredImage || firstVariant?.image;

  return (
    <Link
      to={`/products/${product.handle}`}
      className="group relative bg-white overflow-hidden block"
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-neutral-100">
        {image ? (
          <Image
            data={image}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        ) : (
          <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
            <span className="text-neutral-400 text-sm">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Quick view button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          <span className="block w-full py-3 bg-neutral-900 text-white text-xs tracking-[0.2em] uppercase text-center hover:bg-violet-600 transition-colors">
            Quick View
          </span>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-sm tracking-wide font-medium text-neutral-900 truncate">{product.title}</h3>
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

const HOMEPAGE_SEO_QUERY = `#graphql
  query HomepageSeo($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      name
      description
    }
  }
` as const;

const ALL_PRODUCTS_QUERY = `#graphql
  query AllProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
