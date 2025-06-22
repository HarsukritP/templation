import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/layout/navbar";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import { ThemeProvider } from "../lib/theme-context";

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
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <Auth0Provider>
            <div className="min-h-screen bg-background transition-colors duration-300">
              <Navbar />
              <main className="pt-20">
                {children}
              </main>
            </div>
          </Auth0Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
