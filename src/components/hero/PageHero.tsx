import Image from "next/image";
import type { ReactNode } from "react";

export default function PageHero({
  title,
  subtitle,
  image,
  imageAlt,
  priority = false,
  children,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  image: string;
  imageAlt: string;
  priority?: boolean;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={`relative flex items-end ${compact ? "h-[38vh] min-h-[280px]" : "h-[48vh] min-h-[360px]"}`}
    >
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        {children}
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}
