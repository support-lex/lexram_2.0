"use client";

import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Mail, Phone, MapPin, Send, CheckCircle, Building2 } from "lucide-react";

export default function ContactClient() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <PageLayout fullWidth>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-serif font-bold text-[var(--text-primary)] mb-4">
            Contact Us
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Last updated on 28-04-2026 14:45:52
          </p>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mt-3">
            You may contact us using the information below.
          </p>
        </div>

        {/* Company details band */}
        <div className="mb-10 mt-10 p-6 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] border border-[var(--accent)]/20">
          <div className="flex items-start gap-4">
            <Building2 className="w-6 h-6 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Merchant Legal Entity Name
              </p>
              <p className="text-[var(--text-primary)] font-semibold text-lg">
                RAMASUBRAMANIAN AI SOFTWARE PRIVATE LIMITED
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)]">
              <MapPin className="w-5 h-5 text-[var(--accent)] mb-3" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Registered Address
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                B 225, Maya Nursing Home, 12th Avenue, Maya Nursing Home, Ashok Nagar,
                Chennai, Chennai City Corporation, Tamil Nadu — PIN: 600083
              </p>
            </div>

            <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)]">
              <MapPin className="w-5 h-5 text-[var(--accent)] mb-3" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Operational Address
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                B 225, Maya Nursing Home, 12th Avenue, Maya Nursing Home, Ashok Nagar,
                Chennai, Chennai City Corporation, Tamil Nadu — PIN: 600083
              </p>
            </div>

            <a
              href="tel:8754446066"
              className="block bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)] hover:border-[var(--accent)]/40 transition-colors group"
            >
              <Phone className="w-5 h-5 text-[var(--accent)] mb-3" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Telephone No
              </h3>
              <p className="text-[var(--text-primary)] font-semibold group-hover:text-[var(--accent)] transition-colors">
                8754446066
              </p>
            </a>

            <a
              href="mailto:hello@lexram.ai"
              className="block bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-default)] hover:border-[var(--accent)]/40 transition-colors group"
            >
              <Mail className="w-5 h-5 text-[var(--accent)] mb-3" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                E-Mail ID
              </h3>
              <p className="text-[var(--text-primary)] font-semibold group-hover:text-[var(--accent)] transition-colors">
                hello@lexram.ai
              </p>
            </a>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-[var(--border-default)]">
              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Message Sent!</h3>
                  <p className="text-[var(--text-secondary)]">Thank you for contacting us. We&apos;ll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        className="w-full px-4 py-3 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        className="w-full px-4 py-3 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Subject
                    </label>
                    <select
                      id="subject"
                      required
                      className="w-full px-4 py-3 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="sales">Sales</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-[var(--border-default)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all resize-none"
                      placeholder="How can we help you?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-4 bg-[var(--bg-sidebar)] text-white rounded-lg hover:bg-[var(--bg-sidebar-hover)] transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
