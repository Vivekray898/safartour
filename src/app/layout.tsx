import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/data/site";

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
};

export const viewport: Viewport = {
  themeColor: "#166534",
};

/**
 * Minimal root layout — fonts, globals.css and <html>/<body> only.
 *
 * The public website chrome (Header/Footer/MobileCTABar/FloatingWhatsApp)
 * lives in the `(site)` route group layout, and the CRM has its own shell in
 * `crm/(protected)`. This keeps the marketing UI and the CRM app fully
 * separated: neither tree can render the other's navigation.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${poppins.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
