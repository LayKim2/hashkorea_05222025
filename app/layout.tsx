import type { Metadata } from "next";
import "./globals.css";
import Script from 'next/script'
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "Hash Korea",
  description: "Let our AI guide you to the perfect spots tailored just for you",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full">
        <ClientLayout>
          {children}
        </ClientLayout>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
