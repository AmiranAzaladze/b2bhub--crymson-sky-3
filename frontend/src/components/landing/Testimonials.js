import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

export default function Testimonials({ data }) {
  if (!data) return null;
  return (
    <section
      id="testimonials"
      className="py-24 md:py-32 border-b border-neutral-200 bg-white"
      data-testid="testimonials-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">
              {data.eyebrow}
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.03em] text-neutral-950">
              {data.title} <br />
              <span className="text-neutral-400">{data.title_secondary}</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[#00B67A] text-[#00B67A]" />
              ))}
            </div>
            <div>
              <div className="font-display text-[20px] font-bold tracking-tight text-neutral-950 leading-none">
                {data.rating}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 mt-1">
                {data.rating_sub}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {(data.items || []).map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-neutral-200 p-6 md:p-7 flex flex-col bg-[#FAFAFA] hover:bg-white transition-colors"
              data-testid={`testimonial-${i}`}
            >
              <Quote className="h-5 w-5 text-neutral-300 mb-4" />
              <blockquote className="font-body text-[15px] leading-relaxed text-neutral-800 flex-1">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-neutral-200 flex items-center gap-3">
                <img
                  src={t.img}
                  alt={t.name}
                  className="h-10 w-10 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <div className="font-display text-[14px] font-semibold text-neutral-950">
                    {t.name}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                    {t.role}
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
