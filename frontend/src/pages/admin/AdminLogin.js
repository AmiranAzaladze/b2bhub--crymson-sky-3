import React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { formatApiError } from "../../api/client";

export default function AdminLogin() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("admin@swiftformations.io");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  if (ready && user) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(formatApiError(err?.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#0A0A0A] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark opacity-50 mask-radial pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-12">
            <div className="h-8 w-8 rounded-md bg-white grid place-items-center">
              <span className="text-[#0A0A0A] font-display font-bold text-[14px]">SF</span>
            </div>
            <span className="font-display font-bold text-[18px]">Swift Formations · Admin</span>
          </div>
          <h1 className="font-display text-5xl font-bold tracking-[-0.03em] leading-[1.04] max-w-md">
            Manage every country.<br />
            <span className="text-white/40">From one place.</span>
          </h1>
          <p className="mt-6 text-white/60 text-[15px] leading-relaxed max-w-md">
            Edit hero, pricing, FAQs and branding for each landing page. Edit once, publish to
            its own domain — instantly.
          </p>
        </div>
        <div className="relative font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">
          v1.0 · multi-tenant CMS
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="max-w-sm w-full mx-auto" data-testid="admin-login-card">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin sign-in
          </div>
          <h2 className="font-display text-[32px] font-bold tracking-tight text-neutral-950">
            Welcome back.
          </h2>
          <p className="text-[14px] text-neutral-500 mt-2">
            Sign in to manage your country landing pages.
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4" data-testid="admin-login-form">
            <div>
              <Label htmlFor="email" className="text-[12.5px] font-medium text-neutral-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@brand.io"
                className="h-11 mt-1.5"
                data-testid="login-email"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-[12.5px] font-medium text-neutral-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 mt-1.5"
                data-testid="login-password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                className="text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"
                data-testid="login-error"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0A0A0A] hover:bg-neutral-800 text-white rounded-full text-[14px] font-medium"
              data-testid="login-submit"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in</>
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </form>

          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-400 text-center">
            Protected area · Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
