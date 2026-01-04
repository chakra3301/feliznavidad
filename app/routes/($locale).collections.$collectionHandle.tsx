import {useEffect} from 'react';
import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, useNavigate, Link} from '@remix-run/react';
import {useInView} from 'react-intersection-observer';
import type {
  Filter,
  ProductCollectionSortKeys,
  ProductFilter,
} from '@shopify/hydrogen/storefront-api-types';
import {
  Pagination,
  flattenConnection,
  getPaginationVariables,
  Analytics,
  getSeoMeta,
  Image,
  Money,
} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';

import {SortFilter, type SortParam} from '~/components/SortFilter';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {FILTER_URL_PREFIX} from '~/components/SortFilter';
import {parseAsCurrency} from '~/lib/utils';

export const headers = routeHeaders;

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });
  const {collectionHandle} = params;
  const locale = context.storefront.i18n;

  invariant(collectionHandle, 'Missing collectionHandle param');

  const searchParams = new URL(request.url).searchParams;

  const {sortKey, reverse} = getSortValuesFromParam(
    searchParams.get('sort') as SortParam,
  );
  const filters = [...searchParams.entries()].reduce(
    (filters, [key, value]) => {
      if (key.startsWith(FILTER_URL_PREFIX)) {
        const filterKey = key.substring(FILTER_URL_PREFIX.length);
        filters.push({
          [filterKey]: JSON.parse(value),
        });
      }
      return filters;
    },
    [] as ProductFilter[],
  );

  const {collection, collections} = await context.storefront.query(
    COLLECTION_QUERY,
    {
      variables: {
        ...paginationVariables,
        handle: collectionHandle,
        filters,
        sortKey,
        reverse,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    },
  );

  if (!collection) {
    throw new Response('collection', {status: 404});
  }

  const seo = seoPayload.collection({collection, url: request.url});

  const allFilterValues = collection.products.filters.flatMap(
    (filter) => filter.values,
  );

  const appliedFilters = filters
    .map((filter) => {
      const foundValue = allFilterValues.find((value) => {
        const valueInput = JSON.parse(value.input as string) as ProductFilter;
        if (valueInput.price && filter.price) {
          return true;
        }
        return (
          JSON.stringify(valueInput) === JSON.stringify(filter)
        );
      });
      if (!foundValue) {
        console.error('Could not find filter value for filter', filter);
        return null;
      }

      if (foundValue.id === 'filter.v.price') {
        const input = JSON.parse(foundValue.input as string) as ProductFilter;
        const min = parseAsCurrency(input.price?.min ?? 0, locale);
        const max = input.price?.max
          ? parseAsCurrency(input.price.max, locale)
          : '';
        const label = min && max ? `${min} - ${max}` : 'Price';

        return {
          filter,
          label,
        };
      }
      return {
        filter,
        label: foundValue.label,
      };
    })
    .filter((filter): filter is NonNullable<typeof filter> => filter !== null);

  return json({
    collection,
    appliedFilters,
    collections: flattenConnection(collections),
    seo,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Collection() {
  const {collection, collections, appliedFilters} =
    useLoaderData<typeof loader>();

  const {ref, inView} = useInView();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {collection.image && (
          <Image
            data={collection.image}
            className="absolute inset-0 w-full h-full object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
            <Link to="/" className="hover:text-neutral-900 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/collections" className="hover:text-neutral-900 transition-colors">Collections</Link>
            <span>/</span>
            <span className="text-neutral-900">{collection.title}</span>
          </nav>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-neutral-900">{collection.title}</h1>
          {collection.description && (
            <p className="mt-4 text-neutral-600 max-w-xl">{collection.description}</p>
          )}
        </div>
      </div>

      {/* Products Section */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <SortFilter
            filters={collection.products.filters as Filter[]}
            appliedFilters={appliedFilters}
            collections={collections}
          >
            <Pagination connection={collection.products}>
              {({
                nodes,
                isLoading,
                PreviousLink,
                NextLink,
                nextPageUrl,
                hasNextPage,
                state,
              }) => (
                <>
                  {/* Previous button */}
                  <div className="flex items-center justify-center mb-8">
                    <PreviousLink className="px-8 py-3 border border-neutral-300 text-sm tracking-[0.2em] uppercase text-neutral-600 hover:text-neutral-900 hover:border-neutral-900 transition-colors">
                      {isLoading ? 'Loading...' : '← Load Previous'}
                    </PreviousLink>
                  </div>

                  {/* Product Grid */}
                  <ProductsLoadedOnScroll
                    nodes={nodes}
                    inView={inView}
                    nextPageUrl={nextPageUrl}
                    hasNextPage={hasNextPage}
                    state={state}
                  />

                  {/* Next button */}
                  <div className="flex items-center justify-center mt-12">
                    <NextLink
                      ref={ref}
                      className="px-8 py-3 border border-neutral-300 text-sm tracking-[0.2em] uppercase text-neutral-600 hover:text-neutral-900 hover:border-neutral-900 transition-colors"
                    >
                      {isLoading ? 'Loading...' : 'Load More Products →'}
                    </NextLink>
                  </div>
                </>
              )}
            </Pagination>
          </SortFilter>
        </div>
      </section>

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

function ProductsLoadedOnScroll({
  nodes,
  inView,
  nextPageUrl,
  hasNextPage,
  state,
}: {
  nodes: any;
  inView: boolean;
  nextPageUrl: string;
  hasNextPage: boolean;
  state: any;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (inView && hasNextPage) {
      navigate(nextPageUrl, {
        replace: true,
        preventScrollReset: true,
        state,
      });
    }
  }, [inView, navigate, state, nextPageUrl, hasNextPage]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-neutral-200" data-test="product-grid">
      {nodes.map((product: any) => (
        <CollectionProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function CollectionProductCard({product}: {product: any}) {
  const firstVariant = product.variants?.nodes?.[0];
  const image = product.featuredImage;

  return (
    <Link
      to={`/products/${product.handle}`}
      className="group bg-white block"
    >
      <div className="aspect-[3/4] overflow-hidden relative">
        {image && (
          <Image
            data={image}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Quick view */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          <span className="block w-full py-3 bg-neutral-900 text-white text-xs tracking-[0.2em] uppercase text-center hover:bg-yellow-500 transition-colors">
            Quick View
          </span>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-sm font-medium truncate text-neutral-900">{product.title}</h3>
        <div className="flex items-center gap-2">
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

const COLLECTION_QUERY = `#graphql
  query CollectionDetails(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys!
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        description
        title
      }
      image {
        id
        url
        width
        height
        altText
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        filters: $filters,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
        nodes {
          ...ProductCard
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
    collections(first: 100) {
      edges {
        node {
          title
          handle
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

function getSortValuesFromParam(sortParam: SortParam | null): {
  sortKey: ProductCollectionSortKeys;
  reverse: boolean;
} {
  switch (sortParam) {
    case 'price-high-low':
      return {
        sortKey: 'PRICE',
        reverse: true,
      };
    case 'price-low-high':
      return {
        sortKey: 'PRICE',
        reverse: false,
      };
    case 'best-selling':
      return {
        sortKey: 'BEST_SELLING',
        reverse: false,
      };
    case 'newest':
      return {
        sortKey: 'CREATED',
        reverse: true,
      };
    case 'featured':
      return {
        sortKey: 'MANUAL',
        reverse: false,
      };
    default:
      return {
        sortKey: 'RELEVANCE',
        reverse: false,
      };
  }
}
