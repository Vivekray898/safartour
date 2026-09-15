import { Phone, Mail, MapPin, Clock } from "lucide-react";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PageHero from "@/components/hero/PageHero";
import EnquiryForm from "@/components/forms/EnquiryForm";
import FAQSection from "@/components/sections/FAQ";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import JsonLd from "@/components/seo/JsonLd";
import { buildMetadata, organizationJsonLd } from "@/lib/seo";
import { siteConfig } from "@/data/site";
import { getWhatsAppUrl, generalEnquiryMessage } from "@/lib/whatsapp";
import { images } from "@/data/images";
import { homeFaqs } from "@/data/faqs";

export const metadata = buildMetadata({
  title: "Contact Us — Siliguri Travel Agency",
  description:
    "Contact Safar Tours in Siliguri for custom tour packages, car rentals and travel support across North Bengal and Northeast India. Call, WhatsApp or send an enquiry.",
  path: "/contact",
  ogImage: images.hero.src,
});

export default function ContactPage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />

      <PageHero
        title="Contact Us"
        subtitle="Planning a trip to North Bengal, Sikkim or the Northeast? We're a call, message or form away."
        image={images.hero.src}
        imageAlt={images.hero.alt}
        priority
        compact
      >
        <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />
      </PageHero>

      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Contact info */}
          <div className="space-y-6 lg:col-span-2">
            <SectionHeading
              eyebrow="Reach Us"
              title="Get in Touch"
              description="We reply within 24 hours — often much sooner during business hours. For urgent queries, please call directly."
              align="left"
            />

            <ul className="space-y-5">
              <li className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Phone className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Phone</p>
                  <a
                    href={`tel:${siteConfig.phone}`}
                    className="mt-0.5 block text-sm text-muted transition-colors hover:text-primary"
                  >
                    {siteConfig.phoneDisplay}
                  </a>
                  <a
                    href={`tel:${siteConfig.altPhone}`}
                    className="block text-sm text-muted transition-colors hover:text-primary"
                  >
                    {siteConfig.altPhoneDisplay}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#1da851]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.25 8.25 0 0 1-3.95-1l-.28-.17-2.98.78.8-2.9-.19-.3a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm-2.5 3.16c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                  <a
                    href={getWhatsAppUrl(generalEnquiryMessage())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-sm text-muted transition-colors hover:text-primary"
                  >
                    Chat with us — {siteConfig.phoneDisplay}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Email</p>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="mt-0.5 block text-sm text-muted transition-colors hover:text-primary"
                  >
                    {siteConfig.email}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Office</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">
                    {siteConfig.fullName}
                    <br />
                    {siteConfig.address.street},
                    <br />
                    {siteConfig.address.city} – {siteConfig.address.postalCode},{" "}
                    {siteConfig.address.state}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      (Just 20 minutes from Bagdogra Airport)
                    </span>
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Business Hours
                  </p>
                  {siteConfig.hours.map((h) => (
                    <p key={h.days} className="mt-0.5 text-sm text-muted">
                      {h.days}: {h.time}
                    </p>
                  ))}
                </div>
              </li>
            </ul>

            {/* Map */}
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                title={`Map showing ${siteConfig.name} office in ${siteConfig.address.city}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  `${siteConfig.address.street}, ${siteConfig.address.city} ${siteConfig.address.postalCode}`
                )}&output=embed`}
                width="100%"
                height="280"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="border-0"
              />
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="font-display text-xl font-bold text-foreground">
                Send Us a Message
              </h2>
              <p className="mt-1 text-sm text-muted">
                Fill out the form and our travel experts will respond within 24
                hours.
              </p>
              <div className="mt-6">
                <EnquiryForm />
              </div>
            </div>
          </div>
        </div>
      </Container>

      <FAQSection
        faqs={homeFaqs.slice(0, 5)}
        eyebrow="Quick Answers"
        title="Frequently Asked Questions"
      />
    </>
  );
}
