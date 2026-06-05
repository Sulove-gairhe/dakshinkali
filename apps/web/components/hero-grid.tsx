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
  imageSrc: "/images/hero grid/geyeser(hero grid-1).png",
  imageAlt: "Electric Water Geyser - Best electric geysers in Nepal",
  href: "/search?q=water%20geyser",
  buttonLabel: "Shop Now",
};

const defaultSecondary: HeroCard = {
  badge: "Home Appliance",
  title: "Multi-Door Refrigerators",
  description: "Same Footprint, Bigger Capacity",
  imageSrc: "/images/hero grid/fridge-hero grid(2).png",
  imageAlt: "Multi-door Refrigerator - Ultra Space Technology",
  href: "/search?category=refrigerator",
};

const defaultTertiary: HeroCard = {
  badge: "Entertainment",
  title: "Neo QLED 8K TVs",
  description: "Incredible Picture & Sound",
  imageSrc: "/images/hero grid/tcl tv(hero-grid).jpeg",
  imageAlt: "Samsung Neo QLED 8K TV - Incredible picture and sound",
  href: "/search?category=televisions",
};

export function HeroGrid({
  primary = defaultPrimary,
  secondary = defaultSecondary,
  tertiary = defaultTertiary,
}: HeroGridProps) {
  return (
    <section className="section-pale relative overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <a
          href={primary.href || "#"}
          className="group relative block min-h-[400px] overflow-hidden rounded-3xl shadow-[0_22px_60px_rgba(8,51,90,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(8,51,90,0.22)] lg:col-span-7 lg:row-span-2 lg:min-h-[500px]"
        >
          <Image
            src={primary.imageSrc}
            alt={primary.imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-primary/35 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
            <span className="badge-premium mb-3 inline-block">
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
              className="btn-primary cursor-pointer"
            >
              {primary.buttonLabel || "Shop Now"}
            </button>
          </div>
        </a>

        <a
          href={secondary.href || "#"}
          className="group relative block min-h-[240px] overflow-hidden rounded-3xl shadow-[0_16px_40px_rgba(8,51,90,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(8,51,90,0.18)] lg:col-span-5"
        >
          <Image
            src={secondary.imageSrc}
            alt={secondary.imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="badge-discount mb-2 inline-block">
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
          className="group relative block min-h-[240px] overflow-hidden rounded-3xl shadow-[0_16px_40px_rgba(8,51,90,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(8,51,90,0.18)] lg:col-span-5"
        >
          <Image
            src={tertiary.imageSrc}
            alt={tertiary.imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="badge-discount mb-2 inline-block">
              {tertiary.badge}
            </span>
            <h3 className="mb-1 text-lg font-bold text-white sm:text-xl">
              {tertiary.title}
            </h3>
            <p className="text-sm text-gray-300">{tertiary.description}</p>
          </div>
        </a>
      </div>
      </div>
    </section>
  );
}
