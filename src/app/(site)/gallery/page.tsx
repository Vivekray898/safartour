import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PageHero from "@/components/hero/PageHero";
import GalleryClient from "@/components/gallery/GalleryClient";
import FinalCTA from "@/components/sections/FinalCTA";
import Container from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { galleryImages } from "@/data/gallery";
import { images } from "@/data/images";

export const metadata = buildMetadata({
  title: "Gallery — Himalayan Travel Photography",
  description:
    "Scenes from our journeys across Darjeeling, Sikkim, Kalimpong and the Northeast — mountains, monasteries, tea gardens and the roads between them.",
  path: "/gallery",
  ogImage: images.hero.src,
});

export default function GalleryPage() {
  return (
    <>
      <PageHero
        title="Gallery"
        subtitle="Scenes from the journeys we run — mountains, monasteries, tea gardens and the roads between them."
        image={images.hero.src}
        imageAlt={images.hero.alt}
        priority
        compact
      >
        <Breadcrumbs items={[{ name: "Gallery", href: "/gallery" }]} />
      </PageHero>

      <Container className="py-12 lg:py-16">
        <GalleryClient images={galleryImages} />
      </Container>

      <FinalCTA
        title="Picture yourself here"
        description="Tell us which view you'd like to wake up to — we'll plan the trip."
      />
    </>
  );
}
