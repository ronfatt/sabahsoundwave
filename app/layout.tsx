import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/footer";

const siteTitle = "Sabah Soundwave – The Official Home of Sabah Original Music";
const siteDescription =
  "Discover Sabah artists, bands, and original music. Explore local releases, live concerts, and artist launch support across Sabah.";

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: "%s | Sabah Soundwave"
  },
  description: siteDescription,
  metadataBase: new URL("https://www.sabahsoundwave.com"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "https://www.sabahsoundwave.com",
    siteName: "Sabah Soundwave",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Sabah Soundwave"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/twitter-image.png"]
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicOrganization",
    name: "Sabah Soundwave",
    url: "https://www.sabahsoundwave.com",
    description: "The official home of Sabah original music and artists.",
    areaServed: "Sabah, Malaysia"
  };

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="min-h-screen">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
