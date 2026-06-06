import "./globals.css";
import { Figtree, Nunito, Poppins } from "next/font/google";
import { AppProviders } from "@/components/providers";
import { SearchDataProvider } from "@/components/search-data-provider";
import { fetchDbProducts, fetchDbCategories } from "@/lib/db-products";
import { absoluteUrl, getSiteUrl, SITE_NAME } from "@/lib/seo";
import { cn } from "@/lib/utils";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
});
const nunito = Nunito({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s`,
  },
  description:
    "Shop TVs, refrigerators, washing machines, kitchen appliances, and electronics in Nepal at Dakshinkali Electronics.",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      "Shop electronics and home appliances in Nepal at Dakshinkali Electronics.",
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description:
      "Shop electronics and home appliances in Nepal at Dakshinkali Electronics.",
  },
  icons: {
    icon: "/images/logo-placeholder white.png",
    shortcut: "/images/logo-placeholder white.png",
    apple: "/images/logo-placeholder white.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch once at the layout level — available to every page including the navbar
  const [dbProducts, dbCategories] = await Promise.all([
    fetchDbProducts(),
    fetchDbCategories(),
  ]);

  return (
    <html
      lang="en"
      className={cn(figtree.variable, poppins.variable, nunito.variable)}
    >
      <body>
        <AppProviders>
          <SearchDataProvider
            dbProducts={dbProducts}
            dbCategories={dbCategories}
          >
            {children}
          </SearchDataProvider>
        </AppProviders>
      </body>
    </html>
  );
}
