import Breadcrumbs from "@/components/seo/Breadcrumbs";
import Container from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/data/site";

export const metadata = buildMetadata({
  title: "Terms & Conditions",
  description:
    "Terms governing tour bookings, car rentals and services provided by Safar Tours & Travels.",
  path: "/terms",
});

const sections = [
  {
    heading: "About These Terms",
    paragraphs: [
      `These terms govern the services offered by ${siteConfig.legalName} ("we", "us"), including tour packages, custom itineraries, car rentals and transfers. Submitting an enquiry or confirming a booking means you accept these terms.`,
    ],
  },
  {
    heading: "Bookings & Confirmation",
    paragraphs: [
      "A booking is confirmed only after you receive written confirmation from our team (phone, WhatsApp or email) and pay the agreed booking advance. Quotes are typically valid for the dates stated in the quote; prices may vary by season, availability and hotel category.",
    ],
  },
  {
    heading: "Payments",
    paragraphs: [
      "Booking advances and balance payment schedules are shared with your quote. Unless otherwise agreed, the balance is due before the start of the trip. This website itself does not process payments.",
    ],
  },
  {
    heading: "Cancellations & Refunds",
    paragraphs: [
      "Cancellation terms (including any advance retention) are communicated with your booking confirmation. Refunds, where applicable, are processed through the original payment channel within a reasonable period. Costs already paid to hotels or transport partners may be non-refundable.",
    ],
  },
  {
    heading: "Permits & Travel Documents",
    paragraphs: [
      "Certain areas (including Tsomgo Lake, Nathula, North Sikkim and Arunachal Pradesh) require protected-area permits or Inner Line Permits. We assist with permit arrangements, but you must provide accurate ID documents. Permits are subject to government approval and may be denied or restricted for reasons beyond our control.",
    ],
  },
  {
    heading: "Itineraries & Force Majeure",
    paragraphs: [
      "Mountain travel is weather-dependent. Landslides, snowfall, strikes or road closures may require itinerary changes or delays. Where the itinerary is disrupted by events beyond our control, we will always work to rearrange services, but we are not liable for consequences of such events.",
    ],
  },
  {
    heading: "Vehicles & Conduct",
    paragraphs: [
      "Vehicles are provided with experienced drivers. Smoking inside vehicles, overloading beyond seated capacity, and carriage of prohibited goods are not permitted. Damage caused by passengers may be charged at actual repair cost.",
    ],
  },
  {
    heading: "Liability",
    paragraphs: [
      "We arrange services with reasonable care. Our liability for any claim connected with a booking is limited to the amount paid for the affected service. We are not liable for losses arising from third-party providers, government restrictions, weather or events outside our control.",
    ],
  },
  {
    heading: "Governing Law",
    paragraphs: [
      "These terms are governed by the laws of India, with jurisdiction in the courts of Siliguri, West Bengal.",
    ],
  },
];

export default function TermsPage() {
  return (
    <Container className="py-12 pt-28 lg:py-16 lg:pt-32">
      <Breadcrumbs items={[{ name: "Terms & Conditions", href: "/terms" }]} />
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Terms &amp; Conditions
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: September 2026
      </p>

      <div className="mt-10 max-w-3xl space-y-10">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl font-bold text-foreground">
              {section.heading}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="mt-3 text-base leading-relaxed text-muted">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">
            Contact
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Questions about these terms? Email{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-medium text-primary hover:underline"
            >
              {siteConfig.email}
            </a>{" "}
            or call {siteConfig.phoneDisplay}.
          </p>
        </section>
      </div>
    </Container>
  );
}
