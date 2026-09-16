"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { nav, siteConfig } from "@/data/site";
import MobileMenu from "@/components/layout/MobileMenu";
import EnquiryModal from "@/components/forms/EnquiryModal";

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled
            ? "border-b border-border bg-card/95 shadow-sm backdrop-blur"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center gap-2 font-display text-lg font-bold tracking-tight transition-colors ${
              scrolled ? "text-foreground" : "text-white"
            }`}
            aria-label={`${siteConfig.name} — home`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg font-display text-base font-extrabold ${
                scrolled
                  ? "bg-primary text-white"
                  : "bg-white/15 text-white backdrop-blur-sm"
              }`}
              aria-hidden
            >
              S
            </span>
            <span>
              Safar<span className="text-secondary">Tours</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                  scrolled
                    ? isActive(item.href)
                      ? "font-semibold text-primary"
                      : "text-foreground hover:text-primary"
                    : isActive(item.href)
                      ? "font-semibold text-white"
                      : "text-white/90 hover:text-white"
                }`}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <EnquiryModal
                label="Plan My Trip"
                title="Plan Your Trip with Safar Tours"
                variant={scrolled ? "primary" : "secondary"}
                size="md"
              />
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label="Open menu"
              className={`rounded-lg p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary lg:hidden ${
                scrolled
                  ? "text-foreground hover:bg-foreground/5"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <Menu className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={closeMobile} />
    </>
  );
}
