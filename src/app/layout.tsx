import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product Background Batch Generator",
  description: "High-performance batch generation of product image variations over background collections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
