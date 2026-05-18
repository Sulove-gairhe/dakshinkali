import Image from "next/image";

type HeroCard = {
  badge: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href?: string;
  buttonLabel?: string;
};

type HeroGridProps = {
  primary?: HeroCard;
  secondary?: HeroCard;
  tertiary?: HeroCard;
};

const defaultPrimary: HeroCard = {
  badge: "Featured",
  title: "Electric Water Geysers",
  description:
    "Best-in-class electric geysers for your home. Efficient heating, superior insulation.",
  imageSrc: "public/images/geyeser(hero grid-1).png",
  imageAlt: "Electric Water Geyser - Best electric geysers in Nepal",
  href: "#",
  buttonLabel: "Shop Now",
};

const defaultSecondary: HeroCard = {
  badge: "Home Appliance",
  title: "Multi-Door Refrigerators",
  description: "Same Footprint, Bigger Capacity",
  imageSrc: "public/images/fridge-hero grid(2).png",
  imageAlt: "Multi-door Refrigerator - Ultra Space Technology",
  href: "#",
};

const defaultTertiary: HeroCard = {
  badge: "Entertainment",
  title: "Neo QLED 8K TVs",
  description: "Incredible Picture & Sound",
  imageSrc: "public/images/tcl tv(hero-grid).jpeg",
  imageAlt: "Samsung Neo QLED 8K TV - Incredible picture and sound",
  href: "#",
};

export function HeroGrid({
  primary = defaultPrimary,
  secondary = defaultSecondary,
  tertiary = defaultTertiary,
}: HeroGridProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <a
          href={primary.href || "#"}
          className="group relative overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] lg:col-span-7 lg:row-span-2 min-h-[400px] lg:min-h-[500px] block"
        >
          <Image
            src={primary.imageSrc}
            alt={primary.imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
            <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground mb-3">
              {primary.badge}
            </span>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              {primary.title}
            </h2>
            <p className="mb-4 max-w-md text-sm text-gray-200 sm:text-base">
              {primary.description}
            </p>
            <button
              type="button"
              className="cursor-pointer rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors duration-300 hover:bg-primary/90"
            >
              {primary.buttonLabel || "Shop Now"}
            </button>
          </div>
        </a>

        <a
          href={secondary.href || "#"}
          className="group relative overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(251,191,36,0.15)] lg:col-span-5 min-h-[240px] block"
        >
          <Image
            src={secondary.imageSrc}
            alt={secondary.imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground mb-2">
              {secondary.badge}
            </span>
            <h3 className="mb-1 text-lg font-bold text-white sm:text-xl">
              {secondary.title}
            </h3>
            <p className="text-sm text-gray-300">{secondary.description}</p>
          </div>
        </a>

        <a
          href={tertiary.href || "#"}
          className="group relative overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(139,92,246,0.15)] lg:col-span-5 min-h-[240px] block"
        >
          <Image
            src={tertiary.imageSrc}
            alt={tertiary.imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground mb-2">
              {tertiary.badge}
            </span>
            <h3 className="mb-1 text-lg font-bold text-white sm:text-xl">
              {tertiary.title}
            </h3>
            <p className="text-sm text-gray-300">{tertiary.description}</p>
          </div>
        </a>
      </div>
    </section>
  );
}
