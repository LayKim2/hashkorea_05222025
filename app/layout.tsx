import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script'
import Providers from './components/providers/Providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hash Korea",
  description: "Let our AI guide you to the perfect spots tailored just for you",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" dir="ltr" className="h-full">
      <body className={`antialiased h-full ${inter.className}`}>
        <Providers>
          {children}
        </Providers>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=ko`}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
