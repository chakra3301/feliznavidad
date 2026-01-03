import clsx from 'clsx';
import {flattenConnection, Image, Money, useMoney} from '@shopify/hydrogen';
import type {MoneyV2, Product} from '@shopify/hydrogen/storefront-api-types';

import type {ProductCardFragment} from 'storefrontapi.generated';
import {Link} from '~/components/Link';
import {AddToCartButton} from '~/components/AddToCartButton';
import {isDiscounted, isNewArrival} from '~/lib/utils';
import {getProductPlaceholder} from '~/lib/placeholders';

export function ProductCard({
  product,
  label,
  className,
  loading,
  onClick,
  quickAdd,
}: {
  product: ProductCardFragment;
  label?: string;
  className?: string;
  loading?: HTMLImageElement['loading'];
  onClick?: () => void;
  quickAdd?: boolean;
}) {
  let cardLabel;

  const cardProduct: Product = product?.variants
    ? (product as Product)
    : getProductPlaceholder();
  if (!cardProduct?.variants?.nodes?.length) return null;

  const firstVariant = flattenConnection(cardProduct.variants)[0];

  if (!firstVariant) return null;
  const {image, price, compareAtPrice} = firstVariant;

  if (label) {
    cardLabel = label;
  } else if (isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2)) {
    cardLabel = 'Sale';
  } else if (isNewArrival(product.publishedAt)) {
    cardLabel = 'New';
  }

  return (
    <div className={clsx('flex flex-col', className)}>
      <Link
        onClick={onClick}
        to={`/products/${product.handle}`}
        prefetch="viewport"
        className="group block"
      >
        <div className="relative aspect-[3/4] bg-neutral-900 overflow-hidden">
          {image && (
            <Image
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 50vw"
              data={image}
              alt={image.altText || `Picture of ${product.title}`}
              loading={loading}
            />
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Label badge */}
          {cardLabel && (
            <span className="absolute top-3 right-3 px-2 py-1 text-[10px] tracking-wider uppercase font-medium bg-brand-500/90 text-white">
              {cardLabel}
            </span>
          )}

          {/* Quick view button on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
            <span className="block w-full py-3 bg-white text-black text-xs tracking-[0.2em] uppercase text-center">
              Quick View
            </span>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <h3 className="text-sm font-medium truncate">{product.title}</h3>
          <div className="flex items-center gap-2">
            <Money 
              withoutTrailingZeros 
              data={price!} 
              className="text-sm text-neutral-400"
            />
            {isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2) && (
              <CompareAtPrice
                data={compareAtPrice as MoneyV2}
              />
            )}
          </div>
        </div>
      </Link>
      
      {quickAdd && firstVariant.availableForSale && (
        <div className="px-4 pb-4">
          <AddToCartButton
            lines={[
              {
                quantity: 1,
                merchandiseId: firstVariant.id,
              },
            ]}
            variant="secondary"
            className="w-full py-3 text-xs"
          >
            Add to Cart
          </AddToCartButton>
        </div>
      )}
      
      {quickAdd && !firstVariant.availableForSale && (
        <div className="px-4 pb-4">
          <button 
            disabled 
            className="w-full py-3 border border-neutral-800 text-neutral-500 text-xs tracking-[0.15em] uppercase cursor-not-allowed"
          >
            Sold Out
          </button>
        </div>
      )}
    </div>
  );
}

function CompareAtPrice({
  data,
  className,
}: {
  data: MoneyV2;
  className?: string;
}) {
  const {currencyNarrowSymbol, withoutTrailingZerosAndCurrency} =
    useMoney(data);

  return (
    <span className={clsx('text-xs text-neutral-600 line-through', className)}>
      {currencyNarrowSymbol}
      {withoutTrailingZerosAndCurrency}
    </span>
  );
}
