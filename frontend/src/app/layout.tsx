import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/effects/ClientProviders";
import SkipLink from "@/components/common/SkipLink";

export const metadata: Metadata = {
  title: "MannSaathi - Child Autism Screening Platform",
  description: "A sanctuary for guidance and growth in neurodivergent care.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lexend:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <SkipLink targetId="main-content" />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
