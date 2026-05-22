import "./globals.css";
import type { Metadata } from "next";
import { Figtree, Nunito, Poppins } from "next/font/google";
import { AuthProvider } from "@dakshinkali/auth";
import { CartProvider } from "@/components/cart-provider";
import { CompareProvider } from "@/contexts/compare-context";
import { CompareBar } from "@/components/compare-bar";
import { WishlistProvider } from "@/components/wishlist-provider";
import { cn } from "@/lib/utils";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
});
const nunito = Nunito({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    title: siteName,
    description: siteDescription,
    url: "/",
    images: [
      {
        url: "/images/logo-placeholder.jpeg",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/images/logo-placeholder.jpeg"],
  },
  icons: {
    icon: "/images/logo-placeholder.jpeg",
    shortcut: "/images/logo-placeholder.jpeg",
    apple: "/images/logo-placeholder.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(figtree.variable, poppins.variable, nunito.variable)}
    >
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                {children}
                <CompareBar />
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
