import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileCTABar from "@/components/layout/MobileCTABar";
import FloatingWhatsApp from "@/components/layout/FloatingWhatsApp";

/**
 * Public website layout — owns ALL marketing chrome (header, footer, floating
 * WhatsApp button, mobile CTA bar). Only routes inside `(site)/` render it.
 *
 * The CRM (`/crm/*`) has its own shell and never renders these components.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <FloatingWhatsApp />
      <MobileCTABar />
    </>
  );
}
