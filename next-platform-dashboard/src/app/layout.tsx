import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { identity, seo } from "@/config/brand";
import { Providers } from "@/components/providers";

/**
 * Site metadata generated from brand configuration.
 * @see src/config/brand/identity.ts for brand settings
 */
export const metadata: Metadata = {
  title: {
    default: seo.title,
    template: seo.titleTemplate,
  },
  description: seo.description,
  metadataBase: new URL(identity.url),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: identity.url,
    siteName: identity.name,
    title: seo.title,
    description: seo.description,
    images: seo.ogImage ? [{ url: seo.ogImage, width: 1200, height: 630 }] : [],
  },
  twitter: {
    card: seo.twitterCard,
    site: seo.twitterHandle ? `@${seo.twitterHandle}` : undefined,
    title: seo.title,
    description: seo.description,
    images: seo.ogImage ? [seo.ogImage] : [],
  },
  robots: seo.robots,
  icons: {
    icon: "/favicon.ico",
    apple: "/images/apple-touch-icon.png",
  },
};

/**
 * Viewport configuration for responsive design.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
