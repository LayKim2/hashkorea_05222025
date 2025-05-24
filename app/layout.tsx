import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from './components/providers/Providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hash Korea",
  description: "Discover Korea with Hash Korea",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <script
          async
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=en`}
        />
      </body>
    </html>
  );
}
