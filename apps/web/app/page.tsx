import { HeroGrid } from "@/components/hero-grid";
import { ApplianceStrip } from "@/components/appliance-strip";
import { ClearanceDeals } from "@/components/clearance-deals";
import { HomeTrustSection } from "@/components/home-trust-section";
import { SiteNavbar } from "@/components/site-navbar";
import { TrendingProducts } from "@/components/trending-products";
import { BestSellingProducts } from "@/components/best-selling-products";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { CompareDrawer } from "@/components/compare/CompareDrawer";
import { CompareModal } from "@/components/compare/CompareModal";
import { BuyingGuides } from "@/components/home/BuyingGuides";
import { KitchenAppliances } from "@/components/home/KitchenAppliances";
import { Footer } from "@/components/layout/Footer";
import { fetchStorefrontProductsByKey } from "@/lib/db-products";
import Link from "next/link";

export default async function WebStorePage() {
  const [trending, bestSelling, clearance, kitchen] = await Promise.all([
    fetchStorefrontProductsByKey("trending", 8),
    fetchStorefrontProductsByKey("best_selling", 8),
    fetchStorefrontProductsByKey("clearance_deals", 8),
    fetchStorefrontProductsByKey("kitchen_appliances", 12),
  ]);

  return (
    <CompareProvider>
      <main className="min-h-screen bg-background text-foreground">
        <SiteNavbar />

        <HeroGrid
          primary={{
            badge: "Featured",
            title: "Electric Water Geysers",
            description: "Best-in-class electric geysers for your home.",
            imageSrc: "/images/hero grid/geyeser(hero grid-1).png",
            imageAlt: "Electric Water Geyser",
            href: "/search?q=water%20geyser",
            buttonLabel: "Shop Now",
          }}
          secondary={{
            badge: "Home Appliance",
            title: "Multi-Door Refrigerators",
            description: "Same Footprint, Bigger Capacity",
            imageSrc: "/images/hero grid/fridge-hero grid(2).png",
            imageAlt: "Refrigerator",
            href: "/categories/refrigerator",
          }}
          tertiary={{
            badge: "Entertainment",
            title: "Neo QLED 8K TVs",
            description: "Incredible Picture & Sound",
            imageSrc: "/images/hero grid/tcl tv(hero-grid).jpeg",
            imageAlt: "TV",
            href: "/categories/televisions",
          }}
        />

        <ApplianceStrip />

        {/* Render all main components for verification */}
        <div className="mt-12">
          <BestSellingProducts products={bestSelling} />
          <TrendingProducts products={trending} />
          <HomeTrustSection />
          <SeoLandingLinks />
          <ClearanceDeals products={clearance} />
          <KitchenAppliances products={kitchen} />
          <BuyingGuides />
          <Footer />
        </div>

        {/* Compare feature - drawer and modal */}
        <CompareDrawer />
        <CompareModal />
      </main>
    </CompareProvider>
  );
}

function SeoLandingLinks() {
  const categories = [
    { label: "Samsung TVs", href: "/categories/samsung-tv" },
    { label: "Televisions", href: "/categories/televisions" },
    { label: "Refrigerators", href: "/categories/refrigerator" },
    { label: "Washing Machines", href: "/categories/washing-machine" },
    { label: "Kitchen Appliances", href: "/categories/kitchen-appliance" },
  ];
  const brands = [
    { label: "Samsung", href: "/brands/samsung" },
    { label: "Samsung Refrigerators", href: "/brands/samsung/refrigerator" },
    { label: "Himstar", href: "/brands/himstar" },
    { label: "CG", href: "/brands/cg" },
    { label: "TCL", href: "/brands/tcl" },
  ];

  return (
    <section className="border-y border-border bg-background py-8">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <LandingLinkGroup title="Shop by category" links={categories} />
        <LandingLinkGroup title="Shop by brand" links={brands} />
      </div>
    </section>
  );
}

function LandingLinkGroup({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-border px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary hover:bg-primary/10"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
