import "./globals.css";
import { Figtree, Nunito, Poppins } from "next/font/google";
import { AppProviders } from "@/components/providers";
import { SearchDataProvider } from "@/components/search-data-provider";
import { fetchDbProducts, fetchDbCategories } from "@/lib/db-products";
import { cn } from "@/lib/utils";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
});
const nunito = Nunito({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  title: "Dakshinkali Electronics",
  description: "E-commerce storefront",
  icons: {
    icon: "/images/logo-placeholder.jpeg",
    shortcut: "/images/logo-placeholder.jpeg",
    apple: "/images/logo-placeholder.jpeg",
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
          <SearchDataProvider dbProducts={dbProducts} dbCategories={dbCategories}>
            {children}
          </SearchDataProvider>
        </AppProviders>
      </body>
    </html>
  );
}
