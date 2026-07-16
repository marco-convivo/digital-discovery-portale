import type { Metadata } from "next";
import { Fustat } from "next/font/google";
import "./globals.css";

const fustat = Fustat({
  variable: "--font-fustat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Digital Discovery — Portale",
  description: "La tua presenza digitale, gestita da noi.",
  openGraph: {
    title: "Digital Discovery",
    description: "La tua presenza digitale, gestita da noi.",
    siteName: "Digital Discovery",
    url: SITE_URL,
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Discovery",
    description: "La tua presenza digitale, gestita da noi.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${fustat.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
