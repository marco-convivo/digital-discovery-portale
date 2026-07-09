import type { Metadata } from "next";
import { Fustat } from "next/font/google";
import "./globals.css";

const fustat = Fustat({
  variable: "--font-fustat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Digital Discovery — Portale",
  description:
    "CRM vendite interno e portale cliente di Digital Discovery S.r.l.",
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
