"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus, X, Loader2, AlertCircle, Sparkles, User, Hash, Building2,
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import type { User as SbUser } from "@supabase/supabase-js";

interface NewCaseForm {
  case_name: string;
  case_no: string;
  bank_name: string;
}

const EMPTY_FORM: NewCaseForm = { case_name: "", case_no: "", bank_name: "" };

const FIELDS: {
  id: keyof NewCaseForm;
  label: string;
  placeholder: string;
  icon: typeof User;
}[] = [
  { id: "case_name", label: "Client Name", placeholder: "e.g. Rajesh Kumar", icon: User },
  { id: "case_no", label: "File Ref No", placeholder: "e.g. TSR/2024/001", icon: Hash },
  { id: "bank_name", label: "Name of the Institution", placeholder: "e.g. Indian Bank", icon: Building2 },
];

export default function NewReportModal() {
  const router = useRouter();

  const [user, setUser] = useState<SbUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewCaseForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUser(data.session.user);
    });
  }, []);

  const openModal = useCallback(() => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setFormError(null);
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setFormError(null);

    const { data, error } = await supabase
      .from("tsr_clients")
      .insert({
        user_id: user.id,
        case_name: form.case_name.trim(),
        case_no: form.case_no.trim(),
        bank_name: form.bank_name.trim(),
        status: "new",
      })
      .select("id, case_name, case_no, bank_name, status")
      .single();

    if (error) {
      setFormError(error.message);
      setSubmitting(false);
      return;
    }

    if (data) {
      closeModal();
      router.push(`/dashboard/tsr/${data.id}`);
    }

    setSubmitting(false);
  };

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-cream bg-maroon hover:bg-maroon-deep transition-all hover:-translate-y-0.5 shadow-[0_10px_24px_-12px_rgba(104,3,24,0.55)]"
      >
        <Plus className="w-4 h-4" />
        New Report
      </button>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-maroon-deep/45 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-cream-soft rounded-3xl shadow-[0_30px_80px_-20px_rgba(104,3,24,0.55)] w-full max-w-md p-8 border border-maroon/10"
            >
              <div
                aria-hidden
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-rust/20 blur-3xl pointer-events-none"
              />

              <div className="relative flex items-start justify-between mb-7">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon/10 text-maroon text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
                    <Sparkles className="w-3 h-3 text-rust" />
                    New Report
                  </div>
                  <h2 className="font-display text-2xl font-bold text-maroon leading-tight">
                    Grant a Title Scrutiny Report
                  </h2>
                  <p className="text-sm text-ink/60 mt-1.5">
                    Fill in the client details — we&apos;ll set up their file.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-ink/40 hover:text-maroon transition-colors p-1.5 rounded-lg hover:bg-maroon/10 ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 p-3 mb-5 rounded-xl bg-red-50 border border-red-200"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{formError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleCreateCase} className="space-y-4">
                {FIELDS.map(({ id, label, placeholder, icon: Icon }) => (
                  <div key={id}>
                    <label
                      htmlFor={`new-report-${id}`}
                      className="block text-xs font-semibold text-ink/70 mb-1.5 tracking-wide uppercase"
                    >
                      {label} <span className="text-rust normal-case">*</span>
                    </label>
                    <div className="relative">
                      <Icon className="w-4 h-4 text-maroon/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id={`new-report-${id}`}
                        type="text"
                        required
                        value={form[id]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [id]: e.target.value }))}
                        placeholder={placeholder}
                        disabled={submitting}
                        className="w-full pl-10 pr-3.5 py-3 text-sm rounded-xl border border-maroon/15 bg-cream placeholder:text-ink/35 text-ink focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20 disabled:opacity-60 transition-all"
                      />
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-ink/70 bg-cream hover:bg-cream-warm border border-maroon/15 hover:border-maroon/30 disabled:opacity-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !form.case_name.trim() || !form.case_no.trim() || !form.bank_name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-cream bg-maroon hover:bg-maroon-deep disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_10px_24px_-12px_rgba(104,3,24,0.55)] hover:-translate-y-0.5"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {submitting ? "Granting…" : "Grant Report"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
