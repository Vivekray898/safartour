import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PageHero from "@/components/hero/PageHero";
import FAQSection from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";
import { buildMetadata } from "@/lib/seo";
import { homeFaqs } from "@/data/faqs";
import { images } from "@/data/images";

export const metadata = buildMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers about Safar Tours destinations, custom packages, airport transfers, car rentals, hotels and quotations for travel across Northeast India.",
  path: "/faq",
  ogImage: images.hero.src,
});

export default function FaqPage() {
  return (
    <>
      <PageHero
        title="Frequently Asked Questions"
        subtitle="Everything travellers usually ask before booking with us."
        image={images.hero.src}
        imageAlt={images.hero.alt}
        priority
        compact
      >
        <Breadcrumbs items={[{ name: "FAQ", href: "/faq" }]} />
      </PageHero>

      <FAQSection faqs={homeFaqs} withSchema />

      <FinalCTA
        title="Still have questions?"
        description="Message us on WhatsApp — a real person from our travel team will reply."
      />
    </>
  );
}
