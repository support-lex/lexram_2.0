"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";

type DemoForm = {
  name: string;
  email: string;
  phone: string;
  firm: string;
  message: string;
};

const INITIAL: DemoForm = {
  name: "",
  email: "",
  phone: "",
  firm: "",
  message: "",
};

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [demo, setDemo] = useState<DemoForm>(INITIAL);

  const onDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      id="contact"
      className="relative py-16 md:py-20 bg-[#d8cdb8] overflow-hidden"
      style={{ scrollMarginTop: "80px" }}
    >
      <div
        aria-hidden
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#6b1e2d]/[0.06] blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#6b1e2d]/[0.05] blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-16 items-start">
          {/* Left: content */}
          <div className="lg:pt-2">
          </div>

          {/* Right: Book a Demo card */}
          <div className="relative">
            {submitted ? (
              <div className="rounded-2xl bg-[#6b1e2d] border border-[#6b1e2d]/20 shadow-elegant p-10 flex flex-col items-center justify-center text-center min-h-[480px] gap-5">
                <div className="w-16 h-16 rounded-full bg-[#6b1e2d]/20 border border-[#6b1e2d]/30 grid place-items-center">
                  <CheckCircle2 className="w-8 h-8 text-[#d8cdb8]" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#d8cdb8]">
                  Demo booked!
                </h3>
                <p className="text-base text-[#d8cdb8]/70 max-w-xs leading-relaxed">
                  We&apos;ve received your request. Our team will reach out
                  within one working day to confirm the time.
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[#d8cdb8]/40 tracking-widest uppercase">
                  <span className="h-px w-6 bg-[#6b1e2d]" />
                  LexRam Team
                  <span className="h-px w-6 bg-[#6b1e2d]" />
                </div>
              </div>
            ) : (
              <form
                onSubmit={onDemoSubmit}
                className="relative rounded-2xl bg-[#6b1e2d] border border-[#6b1e2d]/20 shadow-elegant overflow-hidden"
              >
                {/* Top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-[#6b1e2d] via-[#e06040] to-[#6b1e2d]" />

                <div className="p-8 md:p-10">
                  {/* Header */}
                  <div className="mb-7">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#CC5500]">
                        Contact
                      </span>
                      <span className="h-px w-8 bg-[#CC5500]/40" />
                    </div>
                    <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                      Book a Demo
                    </h3>
                    <p className="mt-2 text-sm text-[#d8cdb8]/75 leading-relaxed">
                      See LexRam in action — tailored to your practice. Our team
                      will walk you through Research, Drafting, and TSR live.
                    </p>
                  </div>

                  {/* Fields */}
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#d8cdb8]/85 mb-1.5">
                          Full Name <span className="text-[#CC5500]">*</span>
                        </span>
                        <input
                          type="text"
                          required
                          value={demo.name}
                          onChange={(e) =>
                            setDemo((d) => ({ ...d, name: e.target.value }))
                          }
                          placeholder="Adv. A. Mehta"
                          className="w-full px-4 py-3 rounded-lg bg-[#d8cdb8]/8 border border-[#d8cdb8]/15 text-[#d8cdb8] placeholder:text-[#d8cdb8]/30 focus:outline-none focus:border-[#CC5500] focus:bg-[#d8cdb8]/12 transition text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#d8cdb8]/85 mb-1.5">
                          Email <span className="text-[#CC5500]">*</span>
                        </span>
                        <input
                          type="email"
                          required
                          value={demo.email}
                          onChange={(e) =>
                            setDemo((d) => ({ ...d, email: e.target.value }))
                          }
                          placeholder="you@chambers.in"
                          className="w-full px-4 py-3 rounded-lg bg-[#d8cdb8]/8 border border-[#d8cdb8]/15 text-[#d8cdb8] placeholder:text-[#d8cdb8]/30 focus:outline-none focus:border-[#CC5500] focus:bg-[#d8cdb8]/12 transition text-sm"
                        />
                      </label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#d8cdb8]/85 mb-1.5">
                          Phone
                        </span>
                        <input
                          type="tel"
                          value={demo.phone}
                          onChange={(e) =>
                            setDemo((d) => ({ ...d, phone: e.target.value }))
                          }
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-3 rounded-lg bg-[#d8cdb8]/8 border border-[#d8cdb8]/15 text-[#d8cdb8] placeholder:text-[#d8cdb8]/30 focus:outline-none focus:border-[#CC5500] focus:bg-[#d8cdb8]/12 transition text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#d8cdb8]/85 mb-1.5">
                          Firm / Chambers
                        </span>
                        <input
                          type="text"
                          value={demo.firm}
                          onChange={(e) =>
                            setDemo((d) => ({ ...d, firm: e.target.value }))
                          }
                          placeholder="Optional"
                          className="w-full px-4 py-3 rounded-lg bg-[#d8cdb8]/8 border border-[#d8cdb8]/15 text-[#d8cdb8] placeholder:text-[#d8cdb8]/30 focus:outline-none focus:border-[#CC5500] focus:bg-[#d8cdb8]/12 transition text-sm"
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[#d8cdb8]/85 mb-1.5">
                        What would you like to see?
                      </span>
                      <textarea
                        rows={3}
                        value={demo.message}
                        onChange={(e) =>
                          setDemo((d) => ({ ...d, message: e.target.value }))
                        }
                        placeholder="Research, Drafting, TSR — or all three…"
                        className="w-full px-4 py-3 rounded-lg bg-[#d8cdb8]/8 border border-[#d8cdb8]/15 text-[#d8cdb8] placeholder:text-[#d8cdb8]/30 focus:outline-none focus:border-[#CC5500] focus:bg-[#d8cdb8]/12 transition text-sm resize-none"
                      />
                    </label>
                  </div>

                  {/* Submit */}
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <p className="text-[11px] text-[#d8cdb8]/35 leading-relaxed max-w-[200px]">
                      We reply within one working day.
                    </p>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 bg-[#CC5500] hover:bg-[#e06040] text-[#d8cdb8] px-6 py-3 rounded-lg font-semibold text-sm transition-colors shadow-[0_8px_24px_-8px_rgba(204,85,0,0.55)]"
                    >
                      Book Demo <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
