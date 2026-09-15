"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { nav } from "@/data/site";
import Button from "@/components/ui/Button";

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [packagesOpen, setPackagesOpen] = useState(true);
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
        <span className="font-display text-lg font-bold">
          Safar<span className="text-secondary">Tours</span>
        </span>
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
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        <ul className="space-y-1">
          {nav.map((item) =>
            item.children ? (
              <li key={item.label}>
                <button
                  onClick={() => setPackagesOpen((v) => !v)}
                  aria-expanded={packagesOpen}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-foreground/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                >
                  {item.label}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      packagesOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                {packagesOpen && (
                  <ul className="ml-3 border-l border-border pl-2">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onClose}
                          className={`block rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 hover:text-primary ${
                            pathname === child.href
                              ? "font-medium text-primary"
                              : "text-muted"
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
                      >
                        View All Packages
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            ) : (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`block rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-foreground/5 ${
                    pathname === item.href
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          )}
          <li>
            <Link
              href="/gallery"
              onClick={onClose}
              className={`block rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-foreground/5 ${
                pathname === "/gallery" ? "text-primary" : "text-foreground"
              }`}
            >
              Gallery
            </Link>
          </li>
        </ul>

        <div className="mt-6 border-t border-border pt-6">
          <Button
            href="/contact"
            variant="primary"
            size="lg"
            className="w-full"
          >
            Book Now
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </nav>
    </div>
  );
}
