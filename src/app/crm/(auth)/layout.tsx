import { siteConfig } from "@/data/site";

/**
 * Root layout for `/crm/login` (and any other future chrome-less CRM pages).
 *
 * The app's root layout (`src/app/layout.tsx`) wraps every route with the
 * marketing Header/Footer/CTA components. Those are meant for the public
 * website, not for CRM screens, so this nested root segment renders the CRM
 * pages without them. It keeps the same <html>/<body> contract (fonts,
 * theme color, globals.css) that the marketing layout establishes.
 */
export default function CRMRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-gray-50" data-site={siteConfig.name}>
      {children}
    </section>
  );
}
