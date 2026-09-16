"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { X, Phone, MessageSquare } from "lucide-react";
import { nav, siteConfig } from "@/data/site";
import { isNavItemActive } from "@/lib/nav";
import { getWhatsAppUrl, generalEnquiryMessage } from "@/lib/whatsapp";
import EnquiryModal from "@/components/forms/EnquiryModal";

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current
      ?.querySelector<HTMLElement>("button, [href]")
      ?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id="mobile-menu"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      className="fixed inset-0 z-[60] flex flex-col bg-card"
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 font-display text-lg font-bold"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-extrabold text-white">
            S
          </span>
          <span>
            Safar<span className="text-secondary">Tours</span>
          </span>
        </Link>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-lg p-2 text-foreground hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X className="h-6 w-6" aria-hidden />
        </button>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex-1 overflow-y-auto px-4 py-5"
      >
        <ul className="space-y-1">
          {[...nav, { label: "Gallery", href: "/gallery" }].map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={onClose}
                className={`block rounded-lg px-3.5 py-3 text-base font-medium transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isNavItemActive(pathname, item.href)
                    ? "font-semibold text-primary"
                    : "text-foreground"
                }`}
                aria-current={isNavItemActive(pathname, item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-border pt-6">
          <div onClick={onClose}>
            <EnquiryModal
              label="Plan My Trip"
              title="Plan Your Trip with Safar Tours"
              variant="primary"
              size="lg"
              className="w-full"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <a
              href={`tel:${siteConfig.phone}`}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-xs font-semibold text-foreground hover:bg-foreground/5"
            >
              <Phone className="h-4 w-4 text-primary" aria-hidden />
              Call Us
            </a>
            <a
              href={getWhatsAppUrl(generalEnquiryMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-xs font-semibold text-foreground hover:bg-foreground/5"
            >
              <MessageSquare className="h-4 w-4 text-[#25D366]" aria-hidden />
              WhatsApp
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
}
