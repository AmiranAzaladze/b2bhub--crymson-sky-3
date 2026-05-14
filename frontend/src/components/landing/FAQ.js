import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const faqs = [
  {
    q: "How long does it take to form a UK Limited Company?",
    a: "Most companies are incorporated within 24 hours — many in under 3 hours during Companies House business hours. Same-day service is also available on the All-Inclusive plan.",
  },
  {
    q: "Can non-UK residents form a UK Limited Company?",
    a: "Yes. There's no requirement to be a UK resident or to have a UK visa. You can be a director from anywhere in the world. You will need a UK registered office — which we provide on the Privacy and All-Inclusive plans.",
  },
  {
    q: "What are the total costs, including Companies House?",
    a: "Companies House charges a £50 fee for online incorporation. So the Essential plan total is £62.99, Privacy is £89.99 total, and All-Inclusive is £139.99 total. There are no recurring fees unless you opt for ongoing services.",
  },
  {
    q: "Do I need a UK business bank account?",
    a: "Not to incorporate, but you'll need one to trade. We provide free, fast-track introductions to Tide, Wise Business and Revolut Business — most accounts open within 48 hours.",
  },
  {
    q: "What documents will I receive?",
    a: "Digital Certificate of Incorporation, Memorandum & Articles of Association, share certificates, and your company's statutory register — all delivered by email and stored in your dashboard.",
  },
  {
    q: "Will my home address appear on the public record?",
    a: "Only if you use it as your registered office. With our Privacy plan (£39.99) you can use our London EC2 address as your registered office and director service address — keeping your home address private.",
  },
  {
    q: "What ongoing obligations does a UK Limited Company have?",
    a: "Each year you must file a Confirmation Statement, annual accounts, and a corporation tax return. We send free reminders and offer affordable annual filing services on request.",
  },
  {
    q: "Can I get a refund if I change my mind?",
    a: "Yes — if Companies House has not yet processed your application, we offer a full 14-day refund, no questions asked.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24 md:py-32 border-b border-neutral-200" data-testid="faq-section">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center md:text-left mb-12">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">
            FAQ
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.03em] text-neutral-950">
            Common questions.
          </h2>
          <p className="text-[16px] text-neutral-600 mt-4 leading-relaxed">
            Can't find what you're looking for?{" "}
            <a href="#contact" className="text-neutral-950 underline underline-offset-4">
              Talk to a human →
            </a>
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
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
