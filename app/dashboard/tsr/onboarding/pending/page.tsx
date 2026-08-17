"use client";

import Link from "next/link";
import { Clock, Mail, RefreshCw, ArrowLeft, AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMyOrgRequest, useRoleContext, fmtDate } from "@/lib/rbac";

export default function PendingRequestPage() {
  const router = useRouter();
  const ctx = useRoleContext();
  const { request, loading } = useMyOrgRequest(!ctx.loading);
  const [refreshing, setRefreshing] = useState(false);

  /* If membership shows up (admin approved + invite accepted), redirect home. */
  if (!ctx.loading && ctx.role !== "no_role" && ctx.org) {
    if (typeof window !== "undefined") router.replace("/dashboard/tsr");
    return null;
  }

  if (loading || ctx.loading) {
    return <div className="min-h-full grid place-items-center py-20"><Loader2 className="w-5 h-5 animate-spin text-maroon" /></div>;
  }

  if (!request) {
    return (
      <div className="min-h-full px-6 py-20 max-w-xl mx-auto text-center bg-cream">
        <div className="w-14 h-14 rounded-2xl bg-maroon/10 grid place-items-center mb-3 mx-auto">
          <AlertCircle className="w-6 h-6 text-maroon/60" />
        </div>
        <h1 className="font-display text-2xl font-bold text-maroon">No request found</h1>
        <p className="text-sm text-ink/60 mt-2">You haven&apos;t submitted an organisation request yet.</p>
        <Link href="/dashboard/tsr/onboarding" className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-maroon text-cream text-sm font-semibold hover:bg-maroon-deep transition">
          Back to onboarding
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 sm:px-6 py-10 max-w-2xl mx-auto bg-cream">
      <Link href="/dashboard/tsr/onboarding" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/65 hover:text-ink transition mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        Switch path
      </Link>

      {request.status === "pending" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 grid place-items-center shrink-0">
              <Clock className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-amber-700 font-bold">Under review</div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-amber-900 mt-1 leading-tight">
                Your organisation request is with LexRam
              </h1>
              <p className="text-sm text-amber-800/90 mt-3 leading-relaxed">
                Submitted {fmtDate(request.created_at)}. The LexRam team reviews requests manually — usually within one working day.
                You&apos;ll get an email at <strong>{request.contact_email}</strong> as soon as your organisation is provisioned.
              </p>
            </div>
          </div>
        </div>
      )}

      {request.status === "approved" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 grid place-items-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-emerald-700 font-bold">Approved</div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-emerald-900 mt-1 leading-tight">
                Your organisation is ready
              </h1>
              <p className="text-sm text-emerald-800/90 mt-3 leading-relaxed">
                Check <strong>{request.contact_email}</strong> for the magic-link invite. Once you click it and finish signing in,
                refresh this page — you&apos;ll land directly inside your new organisation&apos;s workspace.
              </p>
            </div>
          </div>
        </div>
      )}

      {request.status === "rejected" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 grid place-items-center shrink-0">
              <XCircle className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-red-700 font-bold">Request declined</div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-red-900 mt-1 leading-tight">
                LexRam couldn&apos;t approve this request
              </h1>
              {request.decision_reason && (
                <p className="text-sm text-red-800/90 mt-3 leading-relaxed">
                  <strong>Reason:</strong> {request.decision_reason}
                </p>
              )}
              <p className="text-sm text-red-800/85 mt-3 leading-relaxed">
                You can switch to the <strong>Individual</strong> path or submit a fresh request with corrections.
              </p>
              <Link href="/dashboard/tsr/onboarding" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-red-800 hover:text-red-900">
                ← Back to onboarding
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Submitted details */}
      <div className="mt-6 rounded-2xl border border-maroon/12 bg-cream-soft p-6">
        <h2 className="text-[10px] tracking-[0.22em] uppercase text-rust font-bold mb-4">What you submitted</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            { k: "Organisation", v: request.organization_name },
            { k: "Type",         v: request.organization_type ?? "—" },
            { k: "Contact",      v: `${request.contact_name} <${request.contact_email}>` },
            { k: "Phone",        v: request.contact_phone ?? "—" },
            { k: "Team size",    v: request.team_size.toString() },
            { k: "Submitted",    v: fmtDate(request.created_at) },
          ].map((r) => (
            <div key={r.k}>
              <dt className="text-[10px] tracking-[0.18em] uppercase text-ink/55">{r.k}</dt>
              <dd className="text-ink/85 mt-0.5 break-words">{r.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={async () => { setRefreshing(true); await ctx.refresh(); window.location.reload(); }}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-maroon/15 text-ink/80 hover:border-maroon hover:text-maroon disabled:opacity-50 transition text-sm"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Check status
        </button>
        <a
          href={`mailto:${request.contact_email}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-maroon/15 text-ink/80 hover:border-maroon hover:text-maroon transition text-sm"
        >
          <Mail className="w-4 h-4" />
          {request.contact_email}
        </a>
      </div>
    </div>
  );
}
