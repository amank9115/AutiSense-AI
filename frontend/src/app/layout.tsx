import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lexend } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/effects/ClientProviders";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  weight: ["300", "400", "500", "600"],
});

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
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${lexend.variable} antialiased min-h-screen flex flex-col`}
      >
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
