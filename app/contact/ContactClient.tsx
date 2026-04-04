"use client";

import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";

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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-[var(--text-primary)] mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--border-default)]">
              <Mail className="w-6 h-6 text-[var(--accent)] mb-3" />
              <h3 className="font-bold text-[var(--text-primary)] mb-1">Email</h3>
              <a href="mailto:contact@lexram.ai" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                contact@lexram.ai
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--border-default)]">
              <Phone className="w-6 h-6 text-[var(--accent)] mb-3" />
              <h3 className="font-bold text-[var(--text-primary)] mb-1">Phone</h3>
              <p className="text-[var(--text-secondary)]">+91 80 1234 5678</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--border-default)]">
              <MapPin className="w-6 h-6 text-[var(--accent)] mb-3" />
              <h3 className="font-bold text-[var(--text-primary)] mb-1">Office</h3>
              <p className="text-[var(--text-secondary)]">
                LexRam Technologies Pvt. Ltd.<br />
                123 Legal Tech Park<br />
                Bangalore, Karnataka 560001
              </p>
            </div>
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
