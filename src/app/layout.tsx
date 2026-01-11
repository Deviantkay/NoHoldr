import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NoHoldr - Fast File Tools",
  description: "Fast file processing in your browser. No uploads, no storage, no waiting.",
  keywords: ["file tools", "PDF", "image", "compress", "convert", "local", "privacy"],
  authors: [{ name: "Deviantkay" }],
  openGraph: {
    title: "NoHoldr",
    description: "Fast file tools that run locally in your browser",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
