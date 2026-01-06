import type {ProductCardFragment} from 'storefrontapi.generated';
import {Section} from '~/components/Text';
import {ProductCard} from '~/components/ProductCard';

type ProductSwimlaneProps = {
  products?: {
    nodes: ProductCardFragment[];
  };
  title?: string;
  count?: number;
  [key: string]: any;
};

export function ProductSwimlane({
  title = 'Featured Products',
  products,
  count = 12,
  ...props
}: ProductSwimlaneProps) {
  if (!products?.nodes?.length) return null;

  return (
    <Section heading={title} padding="y" {...props}>
      <div className="swimlane hiddenScroll md:pb-8 md:scroll-px-8 lg:scroll-px-12 md:px-8 lg:px-12">
        {products.nodes.slice(0, count).map((product) => (
          <ProductCard
            product={product}
            key={product.id}
            className="snap-start w-80"
          />
        ))}
      </div>
    </Section>
  );
}
