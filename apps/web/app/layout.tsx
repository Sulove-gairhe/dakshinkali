import "./globals.css";
import { Figtree, Nunito, Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-heading' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-body' });

export const metadata = {
  title: 'Dakshinkali Electronics',
  description: 'E-commerce storefront',
  icons: {
    icon: '/images/logo-placeholder.jpeg',
    shortcut: '/images/logo-placeholder.jpeg',
    apple: '/images/logo-placeholder.jpeg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(figtree.variable, poppins.variable, nunito.variable)}>
      <body>{children}</body>
    </html>
  );
}
