import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

export default function FAQ({ data }) {
  if (!data) return null;
  return (
    <section id="faq" className="py-24 md:py-32 border-b border-neutral-200" data-testid="faq-section">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center md:text-left mb-12">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">
            {data.eyebrow}
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.03em] text-neutral-950">
            {data.title}
          </h2>
          <p className="text-[16px] text-neutral-600 mt-4 leading-relaxed">
            {data.contact_line}{" "}
            <a href="#contact" className="text-neutral-950 underline underline-offset-4">
              {data.contact_cta}
            </a>
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {(data.items || []).map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b border-neutral-200"
              data-testid={`faq-item-${i}`}
            >
              <AccordionTrigger className="text-left font-display text-[16px] md:text-[17px] font-semibold text-neutral-950 hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[14.5px] text-neutral-600 leading-relaxed pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
