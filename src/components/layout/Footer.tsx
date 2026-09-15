import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { footerExplore, siteConfig } from "@/data/site";
import { getWhatsAppUrl, generalEnquiryMessage } from "@/lib/whatsapp";

const packageLinks = [
  { label: "All Packages", href: "/packages" },
  { label: "Sikkim", href: "/packages/sikkim" },
  { label: "Darjeeling", href: "/packages/darjeeling" },
  { label: "Kalimpong", href: "/packages/kalimpong" },
];

const carRentalLinks = [
  { label: "SUV", href: "/car-rentals/suv" },
  { label: "Sedan", href: "/car-rentals/sedan" },
  { label: "Tempo Traveller", href: "/car-rentals/tempo-traveller" },
  { label: "Bus", href: "/car-rentals/bus" },
];

const companyLinks = [
  { label: "About Us", href: "/about-us" },
  { label: "Contact", href: "/contact" },
  { label: "Gallery", href: "/gallery" },
  { label: "Guides", href: "/guides" },
  { label: "FAQ", href: "/faq" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="bg-foreground text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-bold">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-base font-extrabold text-white"
                aria-hidden
              >
                S
              </span>
              Safar<span className="text-secondary">Tours</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              Plan your next Himalayan journey with a Siliguri-based team that
              knows the hills — tours, comfortable stays and reliable
              transportation across Northeast India.
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-white/80">
              <a
                href={`tel:${siteConfig.phone}`}
                className="flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                {siteConfig.phoneDisplay}
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                {siteConfig.email}
              </a>
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
                <span>
                  {siteConfig.address.street}, {siteConfig.address.city} –{" "}
                  {siteConfig.address.postalCode}, {siteConfig.address.state}
                </span>
              </p>
            </div>
            <div className="mt-5 flex gap-3">
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Safar Tours on Facebook"
                className="rounded-lg bg-white/10 p-2.5 transition-colors hover:bg-white/20"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
                </svg>
              </a>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Safar Tours on Instagram"
                className="rounded-lg bg-white/10 p-2.5 transition-colors hover:bg-white/20"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.26.07 1.64.07 4.85s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38 3.7 3.7 0 0 1-1.38.9c-.42.16-1.06.36-2.23.41-1.26.06-1.64.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.52 0-4.76.07-1.08.05-1.67.23-2.06.38-.52.2-.89.44-1.28.83-.39.39-.63.76-.83 1.28-.15.39-.33.98-.38 2.06C2.62 8.87 2.6 9.24 2.6 12s.02 3.13.08 4.38c.05 1.08.23 1.67.38 2.06.2.52.44.89.83 1.28.39.39.76.63 1.28.83.39.15.98.33 2.06.38 1.24.07 1.61.08 4.76.08s3.52-.01 4.76-.08c1.08-.05 1.67-.23 2.06-.38.52-.2.89-.44 1.28-.83.39-.39.63-.76.83-1.28.15-.39.33-.98.38-2.06.07-1.25.08-1.62.08-4.38s-.01-3.13-.08-4.38c-.05-1.08-.23-1.67-.38-2.06a2.4 2.4 0 0 0-.83-1.28 2.4 2.4 0 0 0-1.28-.83c-.39-.15-.98-.33-2.06-.38C15.52 4 15.15 4 12 4zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zm5.2-2.9a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
                </svg>
              </a>
              <a
                href={getWhatsAppUrl(generalEnquiryMessage())}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with Safar Tours on WhatsApp"
                className="rounded-lg bg-white/10 p-2.5 transition-colors hover:bg-white/20"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.25 8.25 0 0 1-3.95-1l-.28-.17-2.98.78.8-2.9-.19-.3a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm-2.5 3.16c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Explore */}
          <nav aria-label="Explore destinations">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white/60">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {footerExplore.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/80 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Tour Packages */}
          <nav aria-label="Tour packages">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white/60">
              Tour Packages
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {packageLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/80 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Car Rentals */}
          <nav aria-label="Car rentals">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white/60">
              Car Rentals
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {carRentalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/80 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company + Legal */}
          <div>
            <nav aria-label="Company">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white/60">
                Company
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {companyLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/80 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Legal" className="mt-8">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white/60">
                Legal
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {legalLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/80 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-white/60 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName}. All rights
            reserved.
          </p>
          <p>Siliguri, West Bengal, India</p>
        </div>
      </div>
    </footer>
  );
}
