"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { siteConfig } from "@/data/site";
import { getWhatsAppUrl, generalEnquiryMessage } from "@/lib/whatsapp";

export default function MobileCTABar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hidden on contact page (form is already there)
  if (pathname === "/contact") return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="grid grid-cols-3 divide-x divide-border">
        <a
          href={`tel:${siteConfig.phone}`}
          className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          tabIndex={visible ? 0 : -1}
        >
          <Phone className="h-4 w-4 text-primary" aria-hidden />
          Call
        </a>
        <a
          href={getWhatsAppUrl(generalEnquiryMessage())}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          tabIndex={visible ? 0 : -1}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#25D366]" aria-hidden>
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.25 8.25 0 0 1-3.95-1l-.28-.17-2.98.78.8-2.9-.19-.3a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm-2.5 3.16c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01z" />
          </svg>
          WhatsApp
        </a>
        <Link
          href="/contact"
          className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
          tabIndex={visible ? 0 : -1}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21.2 8.4c.5 2.1.2 4.3-.9 6.1a7.6 7.6 0 0 1-5 3.6c-2 .4-4-.1-5.6-1.3L4 18l1.2-5.7a7.6 7.6 0 0 1 1.3-5.6 7.6 7.6 0 0 1 5-3.6c2.1-.4 4.3.2 6.1 1.3" strokeLinecap="round" />
          </svg>
          Enquire
        </Link>
      </div>
    </div>
  );
}
