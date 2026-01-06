import {type MetaArgs, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {getSeoMeta} from '@shopify/hydrogen';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

export async function loader({request}: LoaderFunctionArgs) {
  const seo = seoPayload.page({
    page: {
      title: 'Universe',
      seo: {
        title: 'The Universe',
        description: 'Meet the characters of our universe',
      },
    },
    url: request.url,
  });

  return {seo};
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

// Character data - customize this with your actual lore
const characters = [
  {
    id: 'lefty',
    name: 'Lefty',
    image: '/left.png',
    lore: 'The guardian of the left side, Lefty has watched over the store since the beginning of time. Legend says that every product that passes through the left side of the screen receives a blessing of quality and craftsmanship. Lefty is known for being quiet but fiercely protective of customers seeking the best deals.',
    color: 'violet',
  },
  {
    id: 'righty',
    name: 'Righty',
    image: '/right.png',
    lore: 'Mirror to Lefty, Righty guards the right side with unwavering dedication. Where Lefty blesses quality, Righty bestows style. Together they form an unbreakable duo that ensures every visitor to the store leaves with something special. Righty is more playful than their counterpart, often seen dancing when no one is looking.',
    color: 'yellow',
  },
  {
    id: 'sheckleman',
    name: 'SheckleMan',
    image: '/jew.png',
    lore: 'The mysterious SheckleMan appears when you least expect it. A collector of sheckles and spreader of deals, this enigmatic figure pops up to remind you that the best treasures are worth every coin. Some say if you catch him three times in one visit, you unlock a secret discount. Nobody has ever confirmed this.',
    color: 'emerald',
  },
  {
    id: 'nugget',
    name: 'Nugget',
    image: '/nugget.png',
    lore: 'The party never stops when Nugget is around! This golden bundle of joy lives on the edge of your screen, always ready to celebrate. Click on Nugget and watch the colors fly - a disco of pure happiness. Nugget believes that every purchase deserves a celebration, no matter how small.',
    color: 'orange',
  },
];

export default function UniversePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-8 pb-16 px-6 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs tracking-[0.4em] uppercase text-violet-600/80 block mb-3">
            Welcome to the
          </span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-neutral-900 mb-6">
            Universe
          </h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            Meet the characters that make our store magical. Each one has a story to tell
            and a role to play in your shopping adventure.
          </p>
        </div>
      </section>

      {/* Characters Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-24">
            {characters.map((character, index) => (
              <CharacterCard
                key={character.id}
                character={character}
                reversed={index % 2 === 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            Ready to explore?
          </h2>
          <p className="text-neutral-400 mb-8">
            Now that you've met the crew, it's time to discover what treasures await.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-violet-600 text-white text-sm tracking-[0.2em] uppercase font-medium hover:bg-violet-500 transition-all duration-300"
          >
            <span>Shop Now</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}

function CharacterCard({
  character,
  reversed,
}: {
  character: typeof characters[0];
  reversed: boolean;
}) {
  const colorClasses: Record<string, {bg: string; border: string; accent: string}> = {
    violet: {
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      accent: 'text-violet-600',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      accent: 'text-yellow-600',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      accent: 'text-emerald-600',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      accent: 'text-orange-600',
    },
  };

  const colors = colorClasses[character.color] || colorClasses.violet;

  return (
    <div
      className={`flex flex-col ${
        reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
      } gap-8 lg:gap-16 items-center`}
    >
      {/* Image */}
      <div className={`flex-shrink-0 w-64 h-64 lg:w-80 lg:h-80 ${colors.bg} rounded-3xl flex items-center justify-center p-8 border-2 ${colors.border} shadow-lg`}>
        <img
          src={character.image}
          alt={character.name}
          className="max-w-full max-h-full object-contain drop-shadow-xl"
        />
      </div>

      {/* Lore Box */}
      <div className="flex-1 max-w-xl">
        <span className={`text-xs tracking-[0.3em] uppercase ${colors.accent} font-medium block mb-2`}>
          Character Profile
        </span>
        <h2 className="font-display text-3xl md:text-4xl text-neutral-900 mb-4">
          {character.name}
        </h2>
        <div className={`${colors.bg} border-l-4 ${colors.border} p-6 rounded-r-lg`}>
          <p className="text-neutral-600 leading-relaxed text-lg">
            {character.lore}
          </p>
        </div>
      </div>
    </div>
  );
}
