"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
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
            {nav.map((item) =>
              item.children ? (
                <div key={item.label} className="group relative">
                  <button
                    aria-expanded={false}
                    aria-haspopup="true"
                    className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                      scrolled
                        ? "text-foreground hover:text-primary"
                        : "text-white/90 hover:text-white"
                    }`}
                  >
                    {item.label}
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </button>
                  <div
                    className="invisible absolute left-1/2 top-full z-50 w-[26rem] -translate-x-1/2 translate-y-1 rounded-xl border border-border bg-card p-5 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
                    role="menu"
                    aria-label={`${item.label} menu`}
                  >
                    <div className="grid grid-cols-2 gap-x-6">
                      <div>
                        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Popular Destinations
                        </p>
                        {item.children.slice(0, 3).map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            role="menuitem"
                            className="block rounded-lg px-2 py-2 text-sm text-foreground transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                      <div>
                        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Popular Combinations
                        </p>
                        {item.children.slice(3).map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            role="menuitem"
                            className="block rounded-lg px-2 py-2 text-sm text-foreground transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div
                      className="my-3 border-t border-border"
                      role="presentation"
                    />
                    <Link
                      href={item.href}
                      role="menuitem"
                      className="block rounded-lg bg-primary/5 px-3 py-2 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                    >
                      View All Packages
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                    scrolled
                      ? isActive(item.href)
                        ? "text-primary"
                        : "text-foreground hover:text-primary"
                      : isActive(item.href)
                        ? "text-white"
                        : "text-white/90 hover:text-white"
                  }`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <EnquiryModal
                label="Plan Your Trip"
                title="Plan Your Trip"
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
