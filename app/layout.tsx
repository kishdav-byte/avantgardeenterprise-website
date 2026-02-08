import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://avant-gardeenterprise.com'),
  title: "Avant-Garde Enterprise",
  description: "Redefining the future with bold innovation.",
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { ChatBot } from "@/components/ChatBot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${outfit.variable} antialiased selection:bg-accent selection:text-accent-foreground`}>
        {children}
        <ChatBot />
      </body>
    </html>
  );
}
