"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, IndianRupee, Download } from "lucide-react";
import { useOrg } from "./OrgProvider";

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  amount_inr: number;
  amount?: number;
  status: string;
  currency: string;
  user_email?: string;
  user_phone?: string;
  cashfree_payment_id?: string;
  cashfree_order_id?: string;
  created_at: string;
  paid_at?: string;
}

/** Lightweight invoice/receipt modal shown after a successful payment. */
export default function InvoiceView({
  payment, userEmail, userName, onClose,
}: {
  payment: Payment | null;
  userEmail?: string;
  userName?: string;
  onClose: () => void;
}) {
  const { org } = useOrg();
  if (!payment) return null;

  const when = payment.paid_at ?? payment.created_at;
  const dt = new Date(when);
  const dateStr = Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-md rounded-3xl bg-cream shadow-2xl overflow-hidden border border-maroon/15">
          <div className="h-1.5 w-full bg-gradient-to-r from-rust via-maroon to-rust" />
          <button onClick={onClose} aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-maroon/8 hover:bg-maroon/15 grid place-items-center transition">
            <X className="w-4 h-4 text-maroon" />
          </button>

          <div className="px-7 py-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 grid place-items-center shadow-md">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-maroon leading-tight">Payment successful</div>
                <div className="text-xs text-ink/55">{org?.name ?? "TSR"} · Invoice {payment.order_id}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-maroon/12 bg-cream-soft p-5 space-y-2.5 text-sm">
              <Row label="Amount" value={<span className="inline-flex items-center font-semibold text-maroon"><IndianRupee className="w-3.5 h-3.5" />{payment.amount_inr}</span>} />
              <Row label="Status" value={<span className="text-emerald-700 font-semibold capitalize">{payment.status}</span>} />
              <Row label="Date" value={dateStr} />
              {(userName || userEmail) && <Row label="Billed to" value={`${userName ?? ""}${userName && userEmail ? " · " : ""}${userEmail ?? ""}`} />}
              {payment.cashfree_payment_id && <Row label="Txn ID" value={<span className="font-mono text-xs">{payment.cashfree_payment_id}</span>} />}
            </div>

            <button onClick={() => window.print()}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 border border-maroon/20 text-maroon hover:bg-maroon/5 px-4 py-2.5 rounded-xl text-sm font-semibold transition">
              <Download className="w-4 h-4" /> Save / print receipt
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[11px] tracking-[0.15em] uppercase text-ink/55">{label}</span>
      <span className="text-ink/85 text-right">{value}</span>
    </div>
  );
}
