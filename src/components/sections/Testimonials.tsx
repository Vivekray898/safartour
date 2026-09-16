import { Star, Quote } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { testimonials } from "@/data/testimonials";

export default function Testimonials() {
  return (
    <section className="py-14 sm:py-16 md:py-20" aria-labelledby="testimonials-heading">
      <Container>
        <SectionHeading
          eyebrow="Traveller Experiences"
          title="What Travellers Appreciate"
          description="Reflections from families and travellers who explored the Himalayas with our local team."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <Quote className="h-5 w-5 text-secondary/70" aria-hidden />
              <blockquote className="mt-3.5 flex-1 text-sm leading-relaxed text-muted">
                &ldquo;{t.text}&rdquo;
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
                        className="h-3.5 w-3.5 fill-secondary text-secondary"
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
