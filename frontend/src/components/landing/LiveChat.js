import React from "react";
import { MessageCircle, Send, X } from "lucide-react";

const WHATSAPP_NUMBER = "+4412345678";
const TELEGRAM_URL = "https://t.me/B2BHub_inbox_bot";

const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}`;

export default function LiveChat() {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3"
      data-testid="live-chat"
    >
      {open && (
        <div
          className="rounded-2xl bg-white border border-neutral-200 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)] p-2 w-[240px] animate-in fade-in slide-in-from-bottom-2 duration-200"
          data-testid="live-chat-menu"
        >
          <div className="px-3 py-2.5 border-b border-neutral-100">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
              Live support
            </div>
            <div className="font-display text-[14px] font-semibold text-neutral-950 mt-0.5">
              Chat with our team
            </div>
          </div>

          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 px-3 py-3 mt-1 rounded-lg hover:bg-neutral-50 transition-colors"
            data-testid="live-chat-whatsapp"
          >
            <span className="h-9 w-9 rounded-full grid place-items-center bg-[#25D366] shrink-0">
              <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.296-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488"/>
              </svg>
            </span>
            <span className="text-[14px] font-semibold text-neutral-950 leading-tight">WhatsApp</span>
          </a>

          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-neutral-50 transition-colors"
            data-testid="live-chat-telegram"
          >
            <span className="h-9 w-9 rounded-full grid place-items-center bg-[#229ED9] shrink-0">
              <Send className="h-4 w-4 text-white -ml-0.5" strokeWidth={2.4} />
            </span>
            <span className="text-[14px] font-semibold text-neutral-950 leading-tight">Telegram</span>
          </a>

          <div className="px-3 pt-1 pb-1.5 border-t border-neutral-100 mt-1">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-neutral-400 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 live-dot" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600" />
              </span>
              Online · replies in minutes
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        data-testid="live-chat-toggle"
        className="relative h-14 w-14 rounded-full bg-neutral-950 text-white grid place-items-center shadow-[0_18px_36px_-12px_rgba(0,0,0,0.45)] hover:scale-105 transition-transform"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-neutral-950" />
            </span>
          </>
        )}
      </button>
    </div>
  );
}
