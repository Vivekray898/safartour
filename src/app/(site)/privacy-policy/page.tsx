import Breadcrumbs from "@/components/seo/Breadcrumbs";
import Container from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/data/site";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Safar Tours collects, uses and protects the information you share through enquiry forms and other channels.",
  path: "/privacy-policy",
});

const sections = [
  {
    heading: "Information We Collect",
    paragraphs: [
      "When you submit an enquiry through this website, we collect the details you provide: your name, phone number, email address (if given), travel preferences (destination, dates, number of travellers) and any message you include.",
      "We do not collect payment information — this website does not process payments.",
    ],
  },
  {
    heading: "How We Use Your Information",
    paragraphs: [
      "Your enquiry details are used for one purpose: to respond to your travel request. Our team may contact you by phone, WhatsApp or email to discuss your itinerary and provide quotes.",
      "We do not sell, rent or share your personal information with third parties for their marketing purposes.",
    ],
  },
  {
    heading: "Data Retention",
    paragraphs: [
      "Enquiry records are kept only as long as needed to handle your request and any follow-up travel you book with us. You may ask us to delete your enquiry details at any time.",
    ],
  },
  {
    heading: "Cookies & Analytics",
    paragraphs: [
      "This website may use standard analytics tools to understand aggregate visitor behaviour (pages visited, approximate location, device type). This data does not identify you personally.",
    ],
  },
  {
    heading: "Third-Party Services",
    paragraphs: [
      "Our contact form sends enquiry notifications through a transactional email provider. Embedded maps on the contact page are served by Google Maps, which is governed by Google's own privacy policy.",
    ],
  },
  {
    heading: "Your Rights",
    paragraphs: [
      "You may request access to, correction of, or deletion of the personal details you've shared with us. Contact us using the details on our contact page and we'll respond promptly.",
    ],
  },
  {
    heading: "Changes to This Policy",
    paragraphs: [
      "If we update this policy, the revised version will be posted on this page with an updated date.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <Container className="py-12 pt-28 lg:py-16 lg:pt-32">
      <Breadcrumbs
        items={[{ name: "Privacy Policy", href: "/privacy-policy" }]}
      />
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Privacy Policy
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
            Questions about this policy? Email{" "}
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
