"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import JsonLd from "@/components/seo/JsonLd";
import { faqJsonLd } from "@/lib/seo";
import type { FAQ } from "@/data/faqs";

function FaqItem({ faq, defaultOpen = false }: { faq: FAQ; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card">
      <h3>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:text-base"
        >
          {faq.question}
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
      </h3>
      {open ? (
        <div className="px-5 pb-5">
          <p className="text-sm leading-relaxed text-muted">{faq.answer}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function FAQSection({
  faqs,
  withSchema = false,
  eyebrow,
  title = "Frequently Asked Questions",
  description,
}: {
  faqs: FAQ[];
  withSchema?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section className="py-16 md:py-20 lg:py-24">
      {withSchema ? <JsonLd data={faqJsonLd(faqs)} /> : null}
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem key={faq.question} faq={faq} defaultOpen={i === 0} />
          ))}
        </div>
      </Container>
    </section>
  );
}
