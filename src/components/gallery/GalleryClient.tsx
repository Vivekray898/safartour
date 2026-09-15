"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { GalleryImage } from "@/data/gallery";

const categories = ["All", "Darjeeling", "Sikkim", "Kalimpong", "Travel", "Vehicles"] as const;

export default function GalleryClient({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<string>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (active === "All" ? images : images.filter((i) => i.category === active)),
    [active, images]
  );

  const open = lightboxIndex !== null;
  const current = open ? filtered[lightboxIndex] : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight")
        setLightboxIndex((i) =>
          i === null ? null : (i + 1) % filtered.length
        );
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) =>
          i === null ? null : (i - 1 + filtered.length) % filtered.length
        );
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, filtered.length]);

  return (
    <div>
      {/* Filters */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter gallery by category"
      >
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => {
              setActive(c);
              setLightboxIndex(null);
            }}
            aria-pressed={active === c}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active === c
                ? "bg-primary text-white"
                : "border border-border bg-card text-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((img, i) => (
          <button
            key={img.src}
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={`View larger image: ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-6 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {img.category}
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Modal
        open={open}
        onClose={() => setLightboxIndex(null)}
        labelledBy="lightbox-caption"
      >
        {current ? (
          <figure className="relative aspect-[16/10] w-full bg-black">
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes="(max-width: 900px) 100vw, 900px"
              className="object-contain"
              priority
            />
            <figcaption
              id="lightbox-caption"
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-10 text-center text-sm text-white"
            >
              {current.alt}
            </figcaption>

            {filtered.length > 1 ? (
              <>
                <button
                  onClick={() =>
                    setLightboxIndex(
                      (i) =>
                        i === null
                          ? null
                          : (i - 1 + filtered.length) % filtered.length
                    )
                  }
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  onClick={() =>
                    setLightboxIndex((i) =>
                      i === null ? null : (i + 1) % filtered.length
                    )
                  }
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </>
            ) : null}
          </figure>
        ) : null}
      </Modal>
    </div>
  );
}
