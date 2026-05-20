"use client";

import { HeroGrid } from "@/components/hero-grid";
import { ApplianceStrip } from "@/components/appliance-strip";
import { ClearanceDeals } from "@/components/clearance-deals";
import { HomeTrustSection } from "@/components/home-trust-section";
import { SiteNavbar } from "@/components/site-navbar";
import { TrendingProducts } from "@/components/trending-products";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { CompareDrawer } from "@/components/compare/CompareDrawer";
import { CompareModal } from "@/components/compare/CompareModal";

export default function WebStorePage() {
  return (
    <CompareProvider>
      <main className="min-h-screen bg-background text-foreground">
        <SiteNavbar />

        <HeroGrid
          primary={{
            badge: "Featured",
            title: "Electric Water Geysers",
            description: "Best-in-class electric geysers for your home.",
            imageSrc: "/images/geyeser(hero grid-1).png",
            imageAlt: "Electric Water Geyser",
            href: "/products?category=water-geyser",
            buttonLabel: "Shop Now",
          }}
          secondary={{
            badge: "Home Appliance",
            title: "Multi-Door Refrigerators",
            description: "Same Footprint, Bigger Capacity",
            imageSrc: "/images/fridge-hero grid(2).png",
            imageAlt: "Refrigerator",
            href: "/products?category=refrigerators",
          }}
          tertiary={{
            badge: "Entertainment",
            title: "Neo QLED 8K TVs",
            description: "Incredible Picture & Sound",
            imageSrc: "/images/tcl tv(hero-grid).jpeg",
            imageAlt: "TV",
            href: "/products?category=televisions",
          }}
        />

        <ApplianceStrip />

        {/* Render all main components for verification */}
        <div className="mt-12">
          {/* Trending/Featured Products */}
          <TrendingProducts />
          <ClearanceDeals />
          <HomeTrustSection />
        </div>

        {/* Compare feature - drawer and modal */}
        <CompareDrawer />
        <CompareModal />
      </main>
    </CompareProvider>
  );
}
