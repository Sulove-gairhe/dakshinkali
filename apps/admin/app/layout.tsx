import { AdminProviders } from "@/components/admin-providers";
import "./globals.css";

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
    <html lang="en">
      <body>
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}
