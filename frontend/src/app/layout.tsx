import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/layout/navbar";
import { Auth0Provider } from "@auth0/nextjs-auth0";

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
        <Auth0Provider>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-20">
              {children}
            </main>
          </div>
        </Auth0Provider>
      </body>
    </html>
  );
}
