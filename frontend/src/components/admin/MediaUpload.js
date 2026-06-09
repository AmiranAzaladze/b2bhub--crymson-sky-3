import React from "react";
import api from "../../api/client";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_ORIGIN = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
export const toFullUrl = (u) => (u && u.startsWith("/") ? `${API_ORIGIN}${u}` : u);

async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/admin/blog/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url; // relative /uploads/blog/<file>
}

/**
 * Single cover image upload with preview + remove.
 */
export function CoverUpload({ value, onChange, label = "Cover image" }) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef(null);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div data-testid="cover-upload">
      <div className="text-[12px] font-medium text-zinc-300 mb-1.5">{label}</div>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
          <img src={toFullUrl(value)} alt="cover" className="w-full max-h-[260px] object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-zinc-950/80 border border-zinc-700 grid place-items-center text-zinc-200 hover:text-white hover:bg-zinc-950"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full h-32 rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 grid place-items-center transition-colors"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <span className="flex flex-col items-center gap-1.5">
              <Upload className="h-5 w-5" />
              <span className="text-[12.5px]">Click to upload (JPG/PNG/WebP, &lt;5MB)</span>
            </span>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />
    </div>
  );
}

/**
 * Multi-image gallery — array of URLs.
 */
export function GalleryUpload({ value = [], onChange, label = "Gallery (additional covers)" }) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef(null);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const urls = await Promise.all(files.map(uploadFile));
      onChange([...(value || []), ...urls]);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const removeAt = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div data-testid="gallery-upload">
      <div className="text-[12px] font-medium text-zinc-300 mb-1.5">{label}</div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {value.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 group">
            <img src={toFullUrl(url)} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-zinc-950/80 border border-zinc-700 grid place-items-center opacity-0 group-hover:opacity-100 text-zinc-200 hover:text-white transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 grid place-items-center transition-colors"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
    </div>
  );
}
