import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import type {FetcherWithComponents} from '@remix-run/react';
import clsx from 'clsx';

export function AddToCartButton({
  children,
  lines,
  className = '',
  variant = 'primary',
  width = 'full',
  disabled,
  ...props
}: {
  children: React.ReactNode;
  lines: Array<OptimisticCartLineInput>;
  className?: string;
  variant?: 'primary' | 'secondary' | 'inline';
  width?: 'auto' | 'full';
  disabled?: boolean;
  [key: string]: any;
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-500';
  
  const variantStyles = {
    primary: 'bg-white text-black hover:bg-brand-400 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed',
    secondary: 'border border-neutral-700 text-white hover:border-white hover:bg-white hover:text-black',
    inline: 'text-brand-400 hover:text-brand-300',
  };
  
  const widthStyles = {
    auto: '',
    full: 'w-full',
  };

  const defaultPadding = variant !== 'inline' ? 'px-8 py-4 text-sm tracking-[0.2em] uppercase' : '';

  return (
    <CartForm
      route="/cart"
      inputs={{
        lines,
      }}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher: FetcherWithComponents<any>) => {
        const isLoading = fetcher.state !== 'idle';
        
        return (
          <button
            type="submit"
            className={clsx(
              baseStyles,
              variantStyles[variant],
              widthStyles[width],
              defaultPadding,
              className
            )}
            disabled={disabled || isLoading}
            {...props}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Adding...</span>
              </span>
            ) : (
              children
            )}
          </button>
        );
      }}
    </CartForm>
  );
}
