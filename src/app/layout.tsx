import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/data/site";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileCTABar from "@/components/layout/MobileCTABar";
import FloatingWhatsApp from "@/components/layout/FloatingWhatsApp";

// Display font — referenced by `--font-display` in globals.css and used for
// all headings (`font-display` utility). self-hosted + swap = no layout shift
// and no silent fallback to system fonts.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Tour Packages, Car Rentals & Sightseeing in Sikkim, Darjeeling & Northeast India`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Safar Tours & Travels offers tour packages, car rentals, airport and railway transfers, and sightseeing across Sikkim, Darjeeling, Kalimpong, Dooars and Northeast India.",
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#166534",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`scroll-smooth ${poppins.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Header />
        {children}
        <Footer />
        <FloatingWhatsApp />
        <MobileCTABar />
      </body>
    </html>
  );
}
