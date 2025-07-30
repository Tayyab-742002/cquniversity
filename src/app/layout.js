import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import MainLayout from "@/components/layout/MainLayout";
import { Analytics } from "@vercel/analytics/next";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CQUniversity - Cognitive Assessment Platform",
  description:
    "A comprehensive cognitive testing platform for psychological research",
  keywords: "psychology, cognitive testing, research, assessment, neuroscience",
  authors: [{ name: "CQUniversity Team" }],
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            rel="icon"
            type="image/png"
            href="/favicon-96x96.png"
            sizes="96x96"
          />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link rel="manifest" href="/site.webmanifest" />
        </head>
        <body className={inter.className}>
          <div className="min-h-screen bg-background">
            <MainLayout>
              {children}
              <Analytics />
            </MainLayout>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
