import React from "react";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { Plus, Trash2, GripVertical } from "lucide-react";

export const Field = ({ label, value, onChange, hint, multiline, type = "text", id, testid }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <Label htmlFor={id} className="text-[12px] font-medium text-neutral-700">{label}</Label>
      {hint && (
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
          {hint}
        </span>
      )}
    </div>
    {multiline ? (
      <Textarea
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[80px] resize-none"
        data-testid={testid}
      />
    ) : (
      <Input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-10"
        data-testid={testid}
      />
    )}
  </div>
);

export const Section = ({ title, eyebrow, children }) => (
  <div className="rounded-xl border border-neutral-200 bg-white">
    <div className="px-5 py-4 border-b border-neutral-200">
      {eyebrow && (
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500 mb-0.5">
          {eyebrow}
        </div>
      )}
      <div className="font-display font-semibold text-[16px] tracking-tight text-neutral-950">
        {title}
      </div>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

/** Generic list editor with add/remove */
export const ListEditor = ({ items = [], onChange, renderItem, addLabel = "Add item", makeNew }) => {
  const update = (idx, patch) => {
    const next = items.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, makeNew()]);
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              <GripVertical className="h-3 w-3 text-neutral-400" />
              Item #{i + 1}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-[11px] text-neutral-500 hover:text-neutral-950 disabled:opacity-30 px-1.5"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="text-[11px] text-neutral-500 hover:text-neutral-950 disabled:opacity-30 px-1.5"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="h-6 w-6 grid place-items-center rounded text-neutral-500 hover:text-red-700 hover:bg-red-50"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {renderItem(it, (patch) => update(i, patch), i)}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={add}
        className="w-full border-dashed h-10 text-[12.5px]"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        {addLabel}
      </Button>
    </div>
  );
};

export const StringListEditor = ({ items = [], onChange }) => (
  <ListEditor
    items={items.map((s) => ({ v: s }))}
    onChange={(arr) => onChange(arr.map((x) => x.v))}
    makeNew={() => ({ v: "" })}
    renderItem={(it, patch) => (
      <Input value={it.v} onChange={(e) => patch({ v: e.target.value })} className="h-9" />
    )}
    addLabel="Add line"
  />
);
