"use client";

import { SiteNavbar } from "@/components/site-navbar";
import { Footer } from "@/components/layout/Footer";
import { CheckoutPageContent } from "@/components/checkout/checkout-page-content";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <SiteNavbar />
        <CheckoutPageContent />
      </div>
      <Footer />
    </main>
  );
}
