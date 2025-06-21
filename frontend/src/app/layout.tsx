import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/layout/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Templation - Transform GitHub into Templates",
  description: "Transform GitHub repositories into personalized templates with AI-powered code discovery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-20">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
