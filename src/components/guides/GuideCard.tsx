import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Guide } from "@/data/guides";

export default function GuideCard({ guide }: { guide: Guide }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={guide.heroImage}
          alt={guide.heroImageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold text-foreground">
          <Link
            href={`/guides/${guide.slug}`}
            className="transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {guide.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
          {guide.excerpt}
        </p>
        <Link
          href={`/guides/${guide.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Read Guide
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </article>
  );
}
