import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Finance Tracker | Modern Personal Finance Dashboard",
  description:
    "A modern finance tracker demo showcasing accounts, transactions, budgets, and analytics. Built with Next.js, Supabase, and Plaid.",
  keywords: [
    "finance tracker",
    "personal finance",
    "budget",
    "transactions",
    "plaid",
    "demo",
  ],
  authors: [{ name: "Finance Tracker Demo" }],
  openGraph: {
    title: "Finance Tracker | Modern Personal Finance Dashboard",
    description:
      "A modern finance tracker demo showcasing accounts, transactions, budgets, and analytics.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
