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
            href: "/search?category=refrigerator",
          }}
          tertiary={{
            badge: "Entertainment",
            title: "Neo QLED 8K TVs",
            description: "Incredible Picture & Sound",
            imageSrc: "/images/hero grid/tcl tv(hero-grid).jpeg",
            imageAlt: "TV",
            href: "/search?category=televisions",
          }}
        />

        <ApplianceStrip />

        {/* Render all main components for verification */}
        <div className="mt-12">
          <BestSellingProducts products={bestSelling} />
          <TrendingProducts products={trending} />
          <HomeTrustSection />
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
