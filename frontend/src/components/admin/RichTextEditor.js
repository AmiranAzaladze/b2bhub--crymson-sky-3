import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link as LinkIcon, Image as ImageIcon, Undo2, Redo2, Minus,
} from "lucide-react";
import api from "../../api/client";
import { toast } from "sonner";

/**
 * TipTap-powered rich text editor with toolbar.
 * value/onChange are HTML strings.
 */
export default function RichTextEditor({ value = "", onChange, placeholder = "Start writing…" }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image.configure({ inline: false, HTMLAttributes: { class: "rounded-lg max-w-full my-4" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate({ editor }) { onChange?.(editor.getHTML()); },
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none min-h-[300px] focus:outline-none px-4 py-3",
      },
    },
  });

  // Keep external value in sync if it changes from outside (e.g., load)
  React.useEffect(() => {
    if (!editor) return;
    if (value && editor.getHTML() !== value) editor.commands.setContent(value, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const insertImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("file", file);
      try {
        const { data } = await api.post("/admin/blog/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const url = api.defaults.baseURL.replace(/\/api\/?$/, "") + data.url;
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Upload failed");
      }
    };
    input.click();
  };

  const insertLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev || "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 overflow-hidden" data-testid="rich-text-editor">
      <div className="flex flex-wrap gap-0.5 px-2 py-1.5 bg-zinc-900/80 border-b border-zinc-800">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strike"><Strikethrough className="h-3.5 w-3.5" /></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2"><Heading2 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3"><Heading3 className="h-3.5 w-3.5" /></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bulleted list"><List className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote"><Quote className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code"><Code className="h-3.5 w-3.5" /></Btn>
        <Divider />
        <Btn onClick={insertLink} active={editor.isActive("link")} title="Link"><LinkIcon className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={insertImage} title="Insert image"><ImageIcon className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule"><Minus className="h-3.5 w-3.5" /></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 className="h-3.5 w-3.5" /></Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

const Btn = ({ children, onClick, active, title }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    className={`h-7 w-7 grid place-items-center rounded transition-colors ${active ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"}`}
  >
    {children}
  </button>
);
const Divider = () => <span className="self-center mx-0.5 h-4 w-px bg-zinc-700" />;
