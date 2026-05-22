import './globals.css';
import { AuthProvider } from '@dakshinkali/auth';

export const metadata = {
  title: 'Shop Platform - Admin',
  description: 'E-commerce admin panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
