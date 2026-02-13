import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sabah Soundwave",
  description: "Sabah-only music hub for artists and listeners"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
