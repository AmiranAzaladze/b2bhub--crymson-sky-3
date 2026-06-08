import React from "react";
import { Copy, Check, Code2 } from "lucide-react";
import { buildJsonLd } from "../../lib/seoQuality";

/**
 * JSON-LD preview — shows exactly what schema.org blocks Google will see.
 * Each block has a Copy button + ChevronExpand to collapse/expand.
 */
export default function SchemaPreview({ country, content }) {
  const blocks = React.useMemo(() => buildJsonLd(country, content), [country, content]);
  const [openMap, setOpenMap] = React.useState({});
  const [copied, setCopied] = React.useState("");

  const toggleOpen = (name) => setOpenMap((m) => ({ ...m, [name]: !m[name] }));
  const copyToClip = async (name, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(name);
      setTimeout(() => setCopied(""), 1500);
    } catch (e) {
      // clipboard may be unavailable (e.g. http context) — silently fall through
      void e;
    }
  };

  return (
    <div className="space-y-3" data-testid="schema-preview">
      <div className="flex items-center gap-2 text-[12px] text-zinc-400">
        <Code2 className="h-3.5 w-3.5" />
        <span>{blocks.length} schema.org blocks will be injected per page</span>
      </div>
      {blocks.map((b) => {
        const text = JSON.stringify(b.json, null, 2);
        const open = openMap[b.name] !== false; // default open
        return (
          <div
            key={b.name}
            className="rounded-xl border border-zinc-800 bg-zinc-950/70 overflow-hidden"
            data-testid={`schema-block-${b.name.toLowerCase()}`}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/70 border-b border-zinc-800">
              <button
                type="button"
                onClick={() => toggleOpen(b.name)}
                className="flex items-center gap-2 text-zinc-100 hover:text-white transition-colors"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">@type</span>
                <span className="font-display text-[13px] font-bold tracking-tight">{b.name}</span>
                <span className="text-[10.5px] text-zinc-500">({text.split("\n").length} lines)</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClip(b.name, text)}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors"
              >
                {copied === b.name ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied === b.name ? "Copied" : "Copy"}</span>
              </button>
            </div>
            {open && (
              <pre className="p-4 text-[11.5px] leading-relaxed text-emerald-200/90 overflow-x-auto font-mono">
                {text}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
