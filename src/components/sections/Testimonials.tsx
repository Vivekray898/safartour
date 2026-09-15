import { Star, Quote } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import { testimonials } from "@/data/testimonials";

export default function Testimonials() {
  return (
    <section className="py-16 md:py-20 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow="Guest Stories"
          title="What Our Clients Say"
          description="Real feedback from travellers who explored the Himalayas with us."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <Quote className="h-6 w-6 text-secondary/60" aria-hidden />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted">
                {t.text}
              </blockquote>
              <figcaption className="mt-5 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.location}
                    </p>
                  </div>
                  <div
                    className="flex gap-0.5"
                    role="img"
                    aria-label={`Rated ${t.rating} out of 5 stars`}
                  >
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <Star
                        key={s}
                        className="h-4 w-4 fill-secondary text-secondary"
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
                {t.placeholder ? (
                  <div className="mt-3">
                    <Badge variant="secondary">Sample review — replace before launch</Badge>
                  </div>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
