import React from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { ArrowRight, CalendarCheck2, CheckCircle2, Loader2, Send, Sparkles, ExternalLink, Headset } from "lucide-react";
import { toast } from "sonner";
import api from "../../api/client";
import { trackLeadSubmit } from "../../lib/analytics";
import { WHATSAPP_HREF, TELEGRAM_URL, WHATSAPP_NUMBER } from "../../lib/channels";

// 30-min slots between 09:00 and 17:30 local time.
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

// Build the next N working days (skip Sat/Sun) starting tomorrow.
function nextWorkingDays(n = 7) {
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (out.length < n) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const fmtDay = (d) => d.toLocaleDateString(undefined, { weekday: "short" });
const fmtDate = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
const toIsoSlot = (d, hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  const out = new Date(d);
  out.setHours(h, m, 0, 0);
  return out.toISOString().replace(/\.\d{3}Z$/, "Z");
};

export default function AdvisorDialog({ open, onOpenChange, country }) {
  const days = React.useMemo(nextWorkingDays, []);
  const [selectedDay, setSelectedDay] = React.useState(days[0]);
  const [selectedTime, setSelectedTime] = React.useState(TIME_SLOTS[8]); // 13:00 default
  const [form, setForm] = React.useState({ name: "", email: "", phone: "", note: "" });
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const reset = () => {
    setForm({ name: "", email: "", phone: "", note: "" });
    setErrors({});
    setResult(null);
    setLoading(false);
    setSelectedDay(days[0]);
    setSelectedTime(TIME_SLOTS[8]);
  };

  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(reset, 250);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/leads/advisor-booking", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        preferred_at: toIsoSlot(selectedDay, selectedTime),
        duration_minutes: 30,
        note: form.note.trim() || undefined,
        tenant_slug: country?.slug,
        tenant_brand: country?.brand_name,
      });
      trackLeadSubmit();
      setResult(data);
      toast.success("Booking confirmed — check your email.");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Could not book the meeting. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] p-0 overflow-hidden border-neutral-200 rounded-2xl max-h-[92vh] overflow-y-auto"
        data-testid="advisor-dialog"
      >
        {!result ? (
          <>
            <DialogHeader className="px-7 pt-7 pb-2 text-left">
              <div className="flex items-center gap-3.5">
                <span className="relative grid place-items-center h-12 w-12 rounded-full bg-neutral-950 shrink-0">
                  <Headset className="h-5 w-5 text-white" strokeWidth={2.2} aria-hidden="true" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                  </span>
                </span>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                    Free 30-min consultation · Online now
                  </div>
                  <DialogTitle className="font-display text-[22px] font-bold tracking-tight text-neutral-950">
                    Talk to a formations advisor
                  </DialogTitle>
                </div>
              </div>
              <DialogDescription className="text-[13.5px] text-neutral-600 mt-2.5 leading-relaxed">
                Pick a slot below and we'll meet you in a private branded video room hosted on
                forum.b2bhub.ltd — no Zoom, no install. You'll get a confirmation by email.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} noValidate className="px-7 pb-7 pt-4 space-y-5" data-testid="advisor-form">
              <div>
                <Label className="text-[12.5px] font-medium text-neutral-700 mb-2 block">Choose a day</Label>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" data-testid="advisor-day-picker">
                  {days.map((d) => {
                    const active = d.toDateString() === selectedDay.toDateString();
                    return (
                      <button
                        key={d.toISOString()}
                        type="button"
                        onClick={() => setSelectedDay(d)}
                        className={`shrink-0 px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                          active
                            ? "text-white border-transparent shadow-[0_6px_18px_-8px_rgba(0,0,0,0.25)]"
                            : "bg-white border-neutral-200 hover:border-neutral-400"
                        }`}
                        style={active ? { backgroundColor: country?.brand_color || "#0A0A0A" } : {}}
                        data-testid={`advisor-day-${d.toISOString().slice(0, 10)}`}
                      >
                        <div className={`font-mono text-[10px] uppercase tracking-[0.18em] ${active ? "text-white/80" : "text-neutral-500"}`}>
                          {fmtDay(d)}
                        </div>
                        <div className={`font-display font-semibold text-[15px] mt-0.5 ${active ? "text-white" : "text-neutral-950"}`}>
                          {fmtDate(d)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-[12.5px] font-medium text-neutral-700 mb-2 block">Pick a time</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5" data-testid="advisor-time-picker">
                  {TIME_SLOTS.map((slot) => {
                    const active = slot === selectedTime;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`h-9 rounded-lg text-[13px] font-mono transition-colors ${
                          active
                            ? "text-white border-transparent"
                            : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400"
                        }`}
                        style={active ? { backgroundColor: country?.brand_color || "#0A0A0A" } : {}}
                        data-testid={`advisor-time-${slot.replace(":", "")}`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Your name" id="adv-name" error={errors.name}>
                  <Input id="adv-name" value={form.name} onChange={onChange("name")}
                    placeholder="Jane Doe" className="h-11" data-testid="advisor-name" />
                </Field>
                <Field label="Email" id="adv-email" error={errors.email}>
                  <Input id="adv-email" type="email" value={form.email} onChange={onChange("email")}
                    placeholder="jane@company.com" className="h-11" data-testid="advisor-email" />
                </Field>
              </div>
              <Field label="Phone (optional)" id="adv-phone">
                <Input id="adv-phone" value={form.phone} onChange={onChange("phone")}
                  placeholder="+44 7700 900123" className="h-11" data-testid="advisor-phone" />
              </Field>
              <Field label="What would you like to discuss? (optional)" id="adv-note">
                <Input id="adv-note" value={form.note} onChange={onChange("note")}
                  placeholder="e.g. Setting up a Cayman holding for my SaaS"
                  className="h-11" data-testid="advisor-note" />
              </Field>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-white rounded-full text-[14px] font-medium hover:opacity-90"
                style={{ backgroundColor: country?.brand_color || "#0A0A0A" }}
                data-testid="advisor-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking…
                  </>
                ) : (
                  <>
                    <CalendarCheck2 className="h-4 w-4 mr-2" />
                    Book {fmtDate(selectedDay)} · {selectedTime}
                  </>
                )}
              </Button>

              <div className="pt-4 border-t border-neutral-200">
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-neutral-500" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Prefer chat? Scan to message us
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <QrCard
                    label="WhatsApp"
                    sub={WHATSAPP_NUMBER}
                    href={WHATSAPP_HREF}
                    color="#25D366"
                    testId="advisor-qr-whatsapp"
                  />
                  <QrCard
                    label="Telegram"
                    sub="@B2BHub_inbox_bot"
                    href={TELEGRAM_URL}
                    color="#229ED9"
                    icon={<Send className="h-3 w-3 text-white" strokeWidth={2.6} />}
                    testId="advisor-qr-telegram"
                  />
                </div>
              </div>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-7 py-10 text-center"
            data-testid="advisor-success"
          >
            <div className="h-14 w-14 mx-auto rounded-full bg-green-50 grid place-items-center mb-5">
              <CheckCircle2 className="h-7 w-7 text-green-700" />
            </div>
            <h3 className="font-display text-[22px] font-bold text-neutral-950 tracking-tight">
              {fmtDate(selectedDay)} · {selectedTime}
            </h3>
            <p className="text-[14px] text-neutral-600 mt-2 max-w-md mx-auto leading-relaxed">
              {result.fallback
                ? "Anna will confirm by email shortly and send a private forum.b2bhub.ltd link for your call."
                : "Your branded forum room is ready. Save the link below — you'll also receive it by email."}
            </p>
            {result.meeting_link && (
              <a
                href={result.meeting_link}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-200 hover:border-neutral-400 text-[13px] font-mono"
                data-testid="advisor-meeting-link"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {result.meeting_link.replace(/^https?:\/\//, "")}
              </a>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              className="mt-7 h-11 px-5 text-white rounded-full hover:opacity-90"
              style={{ backgroundColor: country?.brand_color || "#0A0A0A" }}
              data-testid="advisor-close"
            >
              Done
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const Field = ({ label, id, error, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <Label htmlFor={id} className="text-[12.5px] font-medium text-neutral-700">{label}</Label>
      {error && (
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-600">
          {error}
        </span>
      )}
    </div>
    {children}
  </div>
);

const QrCard = ({ label, sub, href, color, icon, testId }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:border-neutral-400 transition-colors group"
    data-testid={testId}
  >
    <div className="bg-white p-1.5 rounded-lg border border-neutral-200 shrink-0">
      <QRCodeSVG value={href} size={56} bgColor="#FFFFFF" fgColor="#0A0A0A" includeMargin={false} />
    </div>
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="h-4 w-4 rounded-full grid place-items-center shrink-0" style={{ backgroundColor: color }}>
          {icon || <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        <span className="font-display text-[13.5px] font-semibold text-neutral-950">{label}</span>
      </div>
      <div className="font-mono text-[10.5px] text-neutral-500 mt-1 truncate group-hover:text-neutral-700 transition-colors">
        {sub}
      </div>
    </div>
  </a>
);
