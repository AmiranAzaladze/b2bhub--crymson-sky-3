import React from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LeadDialog({ open, onOpenChange }) {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    idea: "",
  });
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const reset = () => {
    setForm({ name: "", email: "", phone: "", idea: "" });
    setErrors({});
    setSuccess(false);
    setLoading(false);
  };

  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(reset, 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      toast.success("We'll be in touch within 1 working hour.");
    }, 1100);
  };

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] p-0 overflow-hidden border-neutral-200 rounded-2xl"
        data-testid="lead-dialog"
      >
        {!success ? (
          <>
            <DialogHeader className="px-7 pt-7 pb-2 text-left">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500 mb-2">
                Start your company
              </div>
              <DialogTitle className="font-display text-[26px] font-bold tracking-tight text-neutral-950">
                Let's get you registered.
              </DialogTitle>
              <DialogDescription className="text-[14px] text-neutral-600 mt-1.5">
                Tell us a little about you. A UK advisor will reach out within 1 working hour to
                help you choose the right plan.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} noValidate className="px-7 pb-7 pt-4 space-y-4" data-testid="lead-form">
              <Field label="Full name" id="name" error={errors.name}>
                <Input
                  id="name"
                  value={form.name}
                  onChange={onChange("name")}
                  placeholder="Jane Doe"
                  className="h-11"
                  data-testid="lead-name"
                />
              </Field>
              <Field label="Email" id="email" error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={onChange("email")}
                  placeholder="jane@company.com"
                  className="h-11"
                  data-testid="lead-email"
                />
              </Field>
              <Field label="Phone" id="phone" error={errors.phone}>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={onChange("phone")}
                  placeholder="+44 7700 900123"
                  className="h-11"
                  data-testid="lead-phone"
                />
              </Field>
              <Field label="Tell us about your company (optional)" id="idea">
                <Textarea
                  id="idea"
                  value={form.idea}
                  onChange={onChange("idea")}
                  placeholder="e.g. AI consultancy, e-commerce brand, freelance studio…"
                  className="min-h-[80px] resize-none"
                  data-testid="lead-idea"
                />
              </Field>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#0A0A0A] hover:bg-neutral-800 text-white rounded-full text-[14px] font-medium"
                data-testid="lead-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting
                  </>
                ) : (
                  <>
                    Get my company started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400 text-center mt-3">
                100% private · We never share your details
              </p>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-7 py-12 text-center"
            data-testid="lead-success"
          >
            <div className="h-14 w-14 mx-auto rounded-full bg-green-50 grid place-items-center mb-5">
              <CheckCircle2 className="h-7 w-7 text-green-700" />
            </div>
            <h3 className="font-display text-[22px] font-bold text-neutral-950 tracking-tight">
              You're on the list.
            </h3>
            <p className="text-[14px] text-neutral-600 mt-2 max-w-sm mx-auto">
              A UK formation advisor will reach out within 1 working hour. In the meantime, take
              a look at our pricing plans below.
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="mt-7 h-11 px-5 bg-[#0A0A0A] hover:bg-neutral-800 text-white rounded-full"
              data-testid="lead-close"
            >
              Got it
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
      <Label htmlFor={id} className="text-[12.5px] font-medium text-neutral-700">
        {label}
      </Label>
      {error && (
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-600">
          {error}
        </span>
      )}
    </div>
    {children}
  </div>
);
