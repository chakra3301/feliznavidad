import clsx from 'clsx';
import {useRef} from 'react';
import useScroll from 'react-use/esm/useScroll';
import {
  flattenConnection,
  CartForm,
  Image,
  Money,
  useOptimisticData,
  OptimisticInput,
  type CartReturn,
} from '@shopify/hydrogen';
import type {
  Cart as CartType,
  CartCost,
  CartLine,
  CartLineUpdateInput,
} from '@shopify/hydrogen/storefront-api-types';

import {Link} from '~/components/Link';

type Layouts = 'page' | 'drawer';

export function Cart({
  layout,
  onClose,
  cart,
}: {
  layout: Layouts;
  onClose?: () => void;
  cart: CartReturn | null;
}) {
  const linesCount = Boolean(cart?.lines?.edges?.length || 0);

  return (
    <>
      <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />
      <CartDetails cart={cart} layout={layout} />
    </>
  );
}

export function CartDetails({
  layout,
  cart,
}: {
  layout: Layouts;
  cart: CartType | null;
}) {
  const cartHasItems = !!cart && cart.totalQuantity > 0;
  const container = {
    drawer: 'grid grid-cols-1 h-[calc(100vh-5rem)] grid-rows-[1fr_auto]',
    page: 'w-full pb-12 grid md:grid-cols-2 md:items-start gap-8 md:gap-8 lg:gap-12',
  };

  return (
    <div className={container[layout]}>
      <CartLines lines={cart?.lines} layout={layout} />
      {cartHasItems && (
        <CartSummary cost={cart.cost} layout={layout}>
          <CartDiscounts discountCodes={cart.discountCodes} />
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />
        </CartSummary>
      )}
    </div>
  );
}

function CartDiscounts({
  discountCodes,
}: {
  discountCodes: CartType['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <>
      {/* Have existing discount, display it with a remove option */}
      <dl className={codes && codes.length !== 0 ? 'grid' : 'hidden'}>
        <div className="flex items-center justify-between">
          <dt className="text-sm text-neutral-500">Discount(s)</dt>
          <div className="flex items-center gap-2">
            <UpdateDiscountForm>
              <button className="text-neutral-400 hover:text-neutral-900 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </UpdateDiscountForm>
            <dd className="text-sm text-violet-600">{codes?.join(', ')}</dd>
          </div>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 bg-neutral-100 border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-violet-500 focus:outline-none transition-colors"
            type="text"
            name="discountCode"
            placeholder="Discount code"
          />
          <button className="px-4 py-3 text-sm tracking-wider uppercase text-neutral-600 hover:text-violet-600 border border-neutral-200 hover:border-violet-500 transition-colors">
            Apply
          </button>
        </div>
      </UpdateDiscountForm>
    </>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLines({
  layout = 'drawer',
  lines: cartLines,
}: {
  layout: Layouts;
  lines: CartType['lines'] | undefined;
}) {
  const currentLines = cartLines ? flattenConnection(cartLines) : [];
  const scrollRef = useRef(null);
  const {y} = useScroll(scrollRef);

  const className = clsx([
    y > 0 ? 'border-t border-neutral-200' : '',
    layout === 'page'
      ? 'flex-grow md:translate-y-4'
      : 'px-6 pb-6 overflow-auto transition scrollbar-hide',
  ]);

  return (
    <section
      ref={scrollRef}
      aria-labelledby="cart-contents"
      className={className}
    >
      <ul className="grid gap-6 py-6">
        {currentLines.map((line) => (
          <CartLineItem key={line.id} line={line as CartLine} />
        ))}
      </ul>
    </section>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl: string}) {
  if (!checkoutUrl) return null;

  return (
    <div className="flex flex-col gap-3 mt-4">
      <a
        href={checkoutUrl}
        target="_self"
        className="w-full py-4 bg-neutral-900 text-white text-sm tracking-[0.2em] uppercase font-medium text-center hover:bg-violet-600 transition-all duration-500"
      >
        Continue to Checkout
      </a>
    </div>
  );
}

function CartSummary({
  cost,
  layout,
  children = null,
}: {
  children?: React.ReactNode;
  cost: CartCost;
  layout: Layouts;
}) {
  const summary = {
    drawer: 'grid gap-4 p-6 border-t border-neutral-200 bg-neutral-50',
    page: 'sticky top-nav grid gap-6 p-6 bg-neutral-100 w-full',
  };

  return (
    <section aria-labelledby="summary-heading" className={summary[layout]}>
      <h2 id="summary-heading" className="sr-only">
        Order summary
      </h2>
      <dl className="grid">
        <div className="flex items-center justify-between">
          <dt className="text-neutral-500">Subtotal</dt>
          <dd className="text-lg font-medium text-neutral-900" data-test="subtotal">
            {cost?.subtotalAmount?.amount ? (
              <Money data={cost?.subtotalAmount} />
            ) : (
              '-'
            )}
          </dd>
        </div>
      </dl>
      {children}
    </section>
  );
}

type OptimisticData = {
  action?: string;
  quantity?: number;
};

function CartLineItem({line}: {line: CartLine}) {
  const optimisticData = useOptimisticData<OptimisticData>(line?.id);

  if (!line?.id) return null;

  const {id, quantity, merchandise} = line;

  if (typeof quantity === 'undefined' || !merchandise?.product) return null;

  return (
    <li
      key={id}
      className="flex gap-4"
      style={{
        display: optimisticData?.action === 'remove' ? 'none' : 'flex',
      }}
    >
      <div className="flex-shrink-0">
        {merchandise.image && (
          <Image
            width={100}
            height={100}
            data={merchandise.image}
            className="object-cover object-center w-20 h-20 bg-neutral-100"
            alt={merchandise.title}
          />
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {merchandise?.product?.handle ? (
            <Link
              to={`/products/${merchandise.product.handle}`}
              className="text-sm font-medium text-neutral-900 hover:text-violet-600 transition-colors"
            >
              {merchandise?.product?.title || ''}
            </Link>
          ) : (
            <span className="text-sm font-medium text-neutral-900">{merchandise?.product?.title || ''}</span>
          )}

          <div className="mt-1 space-y-0.5">
            {(merchandise?.selectedOptions || []).map((option) => (
              <p key={option.name} className="text-xs text-neutral-500">
                {option.name}: {option.value}
              </p>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <CartLineQuantityAdjust line={line} />
          <CartLinePrice line={line} as="span" className="text-sm font-medium text-neutral-900" />
        </div>
      </div>

      <ItemRemoveButton lineId={id} />
    </li>
  );
}

function ItemRemoveButton({lineId}: {lineId: CartLine['id']}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{
        lineIds: [lineId],
      }}
    >
      <button
        className="flex items-center justify-center w-8 h-8 text-neutral-400 hover:text-red-500 transition-colors"
        type="submit"
        aria-label="Remove item"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </button>
      <OptimisticInput id={lineId} data={{action: 'remove'}} />
    </CartForm>
  );
}

function CartLineQuantityAdjust({line}: {line: CartLine}) {
  const optimisticId = line?.id;
  const optimisticData = useOptimisticData<OptimisticData>(optimisticId);

  if (!line || typeof line?.quantity === 'undefined') return null;

  const optimisticQuantity = optimisticData?.quantity || line.quantity;

  const {id: lineId} = line;
  const prevQuantity = Number(Math.max(0, optimisticQuantity - 1).toFixed(0));
  const nextQuantity = Number((optimisticQuantity + 1).toFixed(0));

  return (
    <div className="flex items-center border border-neutral-200">
      <UpdateCartButton lines={[{id: lineId, quantity: prevQuantity}]}>
        <button
          name="decrease-quantity"
          aria-label="Decrease quantity"
          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors disabled:text-neutral-300 disabled:cursor-not-allowed"
          value={prevQuantity}
          disabled={optimisticQuantity <= 1}
        >
          <span className="text-lg">−</span>
          <OptimisticInput
            id={optimisticId}
            data={{quantity: prevQuantity}}
          />
        </button>
      </UpdateCartButton>

      <div className="w-10 text-center text-sm text-neutral-900" data-test="item-quantity">
        {optimisticQuantity}
      </div>

      <UpdateCartButton lines={[{id: lineId, quantity: nextQuantity}]}>
        <button
          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
          name="increase-quantity"
          value={nextQuantity}
          aria-label="Increase quantity"
        >
          <span className="text-lg">+</span>
          <OptimisticInput
            id={optimisticId}
            data={{quantity: nextQuantity}}
          />
        </button>
      </UpdateCartButton>
    </div>
  );
}

function UpdateCartButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{
        lines,
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLinePrice({
  line,
  priceType = 'regular',
  ...passthroughProps
}: {
  line: CartLine;
  priceType?: 'regular' | 'compareAt';
  [key: string]: any;
}) {
  if (!line?.cost?.amountPerQuantity || !line?.cost?.totalAmount) return null;

  const moneyV2 =
    priceType === 'regular'
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

  return <Money withoutTrailingZeros {...passthroughProps} data={moneyV2} />;
}

export function CartEmpty({
  hidden = false,
  layout = 'drawer',
  onClose,
}: {
  hidden: boolean;
  layout?: Layouts;
  onClose?: () => void;
}) {
  const scrollRef = useRef(null);
  const {y} = useScroll(scrollRef);

  const container = {
    drawer: clsx([
      'flex flex-col items-center justify-center gap-6 px-6 py-12 h-[calc(100vh-5rem)]',
      y > 0 ? 'border-t border-neutral-200' : '',
    ]),
    page: clsx([
      hidden ? '' : 'grid',
      `pb-12 w-full md:items-start gap-4 md:gap-8 lg:gap-12`,
    ]),
  };

  return (
    <div ref={scrollRef} className={container[layout]} hidden={hidden}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-neutral-100">
          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Your cart is empty</h3>
        <p className="text-sm text-neutral-500 mb-8">
          Looks like you haven't added anything yet. Let's get you started!
        </p>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm tracking-[0.15em] uppercase font-medium hover:bg-violet-600 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
