import {useParams, Form, Await, useRouteLoaderData, Link} from '@remix-run/react';
import {Disclosure} from '@headlessui/react';
import {Suspense, useEffect, useMemo} from 'react';
import {CartForm} from '@shopify/hydrogen';

import {type LayoutQuery} from 'storefrontapi.generated';
import {Cart} from '~/components/Cart';
import {CartLoading} from '~/components/CartLoading';
import {Drawer, useDrawer} from '~/components/Drawer';
import {SheckleMan} from '~/components/SheckleMan';
import {Nugget} from '~/components/Nugget';
import {
  type EnhancedMenu,
  type ChildEnhancedMenuItem,
  useIsHomePath,
} from '~/lib/utils';
import {useIsHydrated} from '~/hooks/useIsHydrated';
import {useCartFetchers} from '~/hooks/useCartFetchers';
import type {RootLoader} from '~/root';

type LayoutProps = {
  children: React.ReactNode;
  layout?: LayoutQuery & {
    headerMenu?: EnhancedMenu | null;
    footerMenu?: EnhancedMenu | null;
  };
};

export function PageLayout({children, layout}: LayoutProps) {
  const {headerMenu, footerMenu} = layout || {};
  return (
    <>
      <div className="flex flex-col min-h-screen bg-white">
        <a href="#mainContent" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-neutral-900 focus:text-white">
          Skip to content
        </a>
        {headerMenu && layout?.shop.name && (
          <Header title={layout.shop.name} menu={headerMenu} />
        )}
        <main role="main" id="mainContent" className="flex-grow">
          {children}
        </main>
        {footerMenu && <Footer menu={footerMenu} shopName={layout?.shop.name} />}
      </div>
      {/* Easter egg characters */}
      <SheckleMan />
      <Nugget />
    </>
  );
}

function Header({title, menu}: {title: string; menu?: EnhancedMenu}) {
  const isHome = useIsHomePath();

  const {
    isOpen: isCartOpen,
    openDrawer: openCart,
    closeDrawer: closeCart,
  } = useDrawer();

  const {
    isOpen: isMenuOpen,
    openDrawer: openMenu,
    closeDrawer: closeMenu,
  } = useDrawer();

  const addToCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesAdd);

  useEffect(() => {
    if (isCartOpen || !addToCartFetchers.length) return;
    openCart();
  }, [addToCartFetchers, isCartOpen, openCart]);

  return (
    <>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      {menu && (
        <MenuDrawer isOpen={isMenuOpen} onClose={closeMenu} menu={menu} />
      )}
      <header
        role="banner"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isHome 
            ? 'bg-transparent hover:bg-white/90 hover:backdrop-blur-xl' 
            : 'bg-white/90 backdrop-blur-xl border-b border-neutral-200/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Top row - Cart icon on right */}
          <div className="flex items-center justify-end mb-2 lg:mb-0 lg:absolute lg:right-6 lg:top-4 lg:z-10">
            {/* Mobile menu button - hidden on desktop */}
            <button
              onClick={openMenu}
              className="relative flex items-center justify-center w-10 h-10 mr-auto"
              style={{display: 'none'}}
              aria-label="Open menu"
            >
              <div className="flex flex-col gap-1.5">
                <span className="w-5 h-0.5 bg-neutral-900" />
                <span className="w-5 h-0.5 bg-neutral-900" />
              </div>
            </button>

            <div className="flex items-center gap-2">
              {/* Search */}
              <Form
                method="get"
                action="/search"
                className="hidden md:flex items-center"
              >
                <button
                  type="submit"
                  className="relative flex items-center justify-center w-10 h-10 text-neutral-500 hover:text-violet-600 transition-colors"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </button>
              </Form>

              {/* Account */}
              <AccountLink />

              {/* Cart */}
              <CartCount openCart={openCart} />
            </div>
          </div>

          {/* Centered Logo */}
          <div className="flex flex-col items-center">
            <Link
              to="/"
              className="flex items-center justify-center"
              prefetch="intent"
            >
              <img 
                src="/feliz_.png" 
                alt={title} 
                className="h-14 md:h-20 lg:h-24 w-auto"
              />
            </Link>

            {/* Navigation below logo */}
            <nav className="flex items-center gap-10 mt-4">
              <Link
                to="/"
                prefetch="intent"
                className="font-display text-lg tracking-[0.15em] uppercase text-neutral-800 hover:text-violet-600 transition-colors relative group"
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-violet-500 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                to="/collections"
                prefetch="intent"
                className="font-display text-lg tracking-[0.15em] uppercase text-neutral-800 hover:text-violet-600 transition-colors relative group"
              >
                Collections
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-violet-500 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                to="/pages/universe"
                prefetch="intent"
                className="font-display text-lg tracking-[0.15em] uppercase text-neutral-800 hover:text-violet-600 transition-colors relative group"
              >
                Universe
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-violet-500 group-hover:w-full transition-all duration-300" />
              </Link>
            </nav>
          </div>
        </div>
      </header>
      {/* Spacer for fixed header */}
      {!isHome && <div className="h-36 lg:h-44" />}
    </>
  );
}

function CartDrawer({isOpen, onClose}: {isOpen: boolean; onClose: () => void}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData) return null;

  return (
    <Drawer open={isOpen} onClose={onClose} heading="Your Cart" openFrom="right">
      <div className="grid h-full">
        <Suspense fallback={<CartLoading />}>
          <Await resolve={rootData?.cart}>
            {(cart) => <Cart layout="drawer" onClose={onClose} cart={cart} />}
          </Await>
        </Suspense>
      </div>
    </Drawer>
  );
}

export function MenuDrawer({
  isOpen,
  onClose,
  menu,
}: {
  isOpen: boolean;
  onClose: () => void;
  menu: EnhancedMenu;
}) {
  return (
    <Drawer open={isOpen} onClose={onClose} openFrom="left" heading="Menu">
      <div className="grid">
        <MenuMobileNav menu={menu} onClose={onClose} />
      </div>
    </Drawer>
  );
}

function MenuMobileNav({
  menu,
  onClose,
}: {
  menu: EnhancedMenu;
  onClose: () => void;
}) {
  const navItems = [
    { id: 'home', title: 'Home', to: '/' },
    { id: 'collections', title: 'Collections', to: '/collections' },
    { id: 'universe', title: 'Universe', to: '/pages/universe' },
  ];

  return (
    <nav className="grid gap-6 p-6">
      {navItems.map((item, index) => (
        <Link
          key={item.id}
          to={item.to}
          onClick={onClose}
          className="text-2xl font-display tracking-[0.1em] uppercase text-neutral-900 hover:text-violet-600 transition-colors"
          style={{animationDelay: `${index * 50}ms`}}
        >
          {item.title}
        </Link>
      ))}
      <div className="pt-6 border-t border-neutral-200">
        <Form method="get" action="/search" className="flex items-center gap-3">
          <input
            type="search"
            name="q"
            placeholder="Search products..."
            className="flex-1 bg-neutral-100 border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-violet-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-3 bg-neutral-900 text-white text-sm uppercase tracking-wider hover:bg-violet-600 transition-colors"
          >
            Go
          </button>
        </Form>
      </div>
    </nav>
  );
}

function AccountLink() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const isLoggedIn = rootData?.isLoggedIn;

  return (
    <Link
      to="/account"
      className="relative flex items-center justify-center w-10 h-10 text-neutral-500 hover:text-violet-600 transition-colors"
      aria-label="Account"
    >
      <Suspense fallback={<AccountIcon />}>
        <Await resolve={isLoggedIn} errorElement={<AccountIcon />}>
          {(loggedIn) => (loggedIn ? <AccountIconFilled /> : <AccountIcon />)}
        </Await>
      </Suspense>
    </Link>
  );
}

function AccountIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function AccountIconFilled() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
  );
}

function CartCount({openCart}: {openCart: () => void}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData) return null;

  return (
    <Suspense fallback={<CartBadge count={0} openCart={openCart} />}>
      <Await resolve={rootData?.cart}>
        {(cart) => (
          <CartBadge count={cart?.totalQuantity || 0} openCart={openCart} />
        )}
      </Await>
    </Suspense>
  );
}

function CartBadge({count, openCart}: {count: number; openCart: () => void}) {
  const isHydrated = useIsHydrated();

  const BadgeContent = useMemo(
    () => (
      <>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-violet-600 text-white text-[10px] font-medium rounded-full">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </>
    ),
    [count],
  );

  return isHydrated ? (
    <button
      onClick={openCart}
      className="relative flex items-center justify-center w-10 h-10 text-neutral-500 hover:text-violet-600 transition-colors"
      aria-label={`Cart (${count} items)`}
    >
      {BadgeContent}
    </button>
  ) : (
    <Link
      to="/cart"
      className="relative flex items-center justify-center w-10 h-10 text-neutral-500 hover:text-violet-600 transition-colors"
      aria-label={`Cart (${count} items)`}
    >
      {BadgeContent}
    </Link>
  );
}

function Footer({menu, shopName}: {menu?: EnhancedMenu; shopName?: string}) {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="font-display text-2xl tracking-wide text-neutral-900">
              {shopName}
            </Link>
            <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
              Experimental silhouettes for those who move differently. 
              Sustainably crafted, ethically produced.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-neutral-400 hover:text-violet-600 transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
                </svg>
              </a>
              <a href="#" className="text-neutral-400 hover:text-violet-600 transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </a>
              <a href="#" className="text-neutral-400 hover:text-violet-600 transition-colors" aria-label="TikTok">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Menu columns */}
          {(menu?.items || []).slice(0, 3).map((item) => (
            <div key={item.id}>
              <h3 className="text-sm tracking-[0.2em] uppercase text-neutral-900 mb-4">
                {item.title}
              </h3>
              {item.items && item.items.length > 0 && (
                <ul className="space-y-3">
                  {item.items.map((subItem: ChildEnhancedMenuItem) => (
                    <li key={subItem.id}>
                      <Link
                        to={subItem.to}
                        target={subItem.target}
                        className="text-sm text-neutral-500 hover:text-violet-600 transition-colors"
                      >
                        {subItem.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} {shopName}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/policies/privacy-policy" className="text-xs text-neutral-400 hover:text-violet-600 transition-colors">
              Privacy
            </Link>
            <Link to="/policies/terms-of-service" className="text-xs text-neutral-400 hover:text-violet-600 transition-colors">
              Terms
            </Link>
            <Link to="/policies/shipping-policy" className="text-xs text-neutral-400 hover:text-violet-600 transition-colors">
              Shipping
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
