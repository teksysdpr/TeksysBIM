import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import RouteShell from "./components/RouteShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TeksysBIM",
  description: "CAD2BIM conversion and BIM project intelligence portal by Teksys",
  icons: {
    icon: [
      { url: "/images/BIM_logo.png", type: "image/png" },
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} m-0 font-sans`}>
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  );
}
