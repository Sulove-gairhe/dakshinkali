import { Figtree, Nunito, Poppins } from "next/font/google";
import { AdminProviders } from "@/components/admin-providers";
import { cn } from "@/lib/cn";
import "./globals.css";

// Admin typography mirrors apps/web font setup to keep brand consistency.
const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
});
const nunito = Nunito({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  title: "Dakshinkali Admin",
  description: "E-commerce admin panel",
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
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}
