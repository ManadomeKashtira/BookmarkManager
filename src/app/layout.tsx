import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlatformProvider } from "@/components/PlatformProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Modern Bookmark Library Manager",
  description: "Manage your bookmarks efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PlatformProvider>
          {children}
        </PlatformProvider>
      </body>
    </html>
  );
}
