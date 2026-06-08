import React from "react";
import { buildSerpPreview } from "../../lib/seoQuality";

/**
 * Live Google SERP snippet preview.
 * Mimics how the page will appear in a Google search result.
 */
export default function SerpPreview({ country, content, compact = false }) {
  const { title, description, domain, url } = React.useMemo(
    () => buildSerpPreview(country, content),
    [country, content]
  );

  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-white ${compact ? "p-4" : "p-5"} shadow-sm`}
      data-testid="serp-preview"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="h-6 w-6 rounded-full bg-zinc-100 grid place-items-center overflow-hidden">
          <img src="/logo.png" alt="" className="h-5 w-5 object-contain" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] text-zinc-600 font-medium">{country?.brand_name || "Swift Formations"}</span>
          <span className="text-[10px] text-zinc-500">{url}</span>
        </div>
      </div>
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="block text-[18px] leading-tight font-medium text-[#1a0dab] hover:underline mt-1"
        style={{ fontFamily: "arial, sans-serif" }}
      >
        {title || <span className="text-zinc-400 italic">No title set</span>}
      </a>
      <p
        className="text-[12.5px] text-[#4d5156] mt-1 leading-snug"
        style={{ fontFamily: "arial, sans-serif" }}
      >
        {description || <span className="text-zinc-400 italic">No description set — Google will auto-generate one from the page body, often poorly.</span>}
      </p>
      <div className="flex items-center justify-between mt-2 text-[10.5px] text-zinc-500 font-mono uppercase tracking-wider">
        <span>{(title || "").length}/65 chars title</span>
        <span>{(description || "").length}/165 chars description</span>
        <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">Google SERP</span>
      </div>
    </div>
  );
}
