"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useOrg } from "../_components/OrgProvider";

type Mode = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const { org, loading: orgLoading } = useOrg();
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const sb = supabase();
      if (mode === "password") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/");
      } else {
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-cream">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-maroon/8 grid place-items-center mx-auto mb-3 overflow-hidden">
            {orgLoading
              ? <Loader2 className="w-6 h-6 animate-spin text-maroon" />
              : org?.logo_url
                ? /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                : <Building2 className="w-7 h-7 text-maroon" />}
          </div>
          <h1 className="font-display text-2xl font-bold text-maroon">{org?.name ?? "TSR Workspace"}</h1>
          <p className="text-sm text-ink/60 mt-1">Sign in to your Title Scrutiny workspace.</p>
        </div>

        <div className="rounded-2xl border border-maroon/12 bg-cream-soft shadow-soft p-6">
          {sent ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-ink/80">
                Magic link sent to <strong>{email}</strong>. Open it to sign in.
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 break-words">{error}</p>
                </div>
              )}

              <label className="block">
                <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Email</span>
                <div className="relative">
                  <Mail className="w-4 h-4 text-maroon/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@firm.in"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition" />
                </div>
              </label>

              {mode === "password" && (
                <label className="block">
                  <span className="block text-[11px] font-semibold tracking-wide text-ink/70 mb-1.5 uppercase">Password</span>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-maroon/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-md border border-maroon/15 bg-cream text-ink focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/15 transition" />
                  </div>
                </label>
              )}

              <button type="submit" disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-deep disabled:opacity-70 text-cream px-5 py-2.5 rounded-lg text-sm font-semibold transition">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "password" ? "Sign in" : "Send magic link"}
              </button>

              <button type="button" onClick={() => { setMode(mode === "password" ? "magic" : "password"); setError(null); }}
                className="w-full text-xs font-medium text-rust hover:text-maroon transition">
                {mode === "password" ? "Use a magic link instead" : "Use email + password instead"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
