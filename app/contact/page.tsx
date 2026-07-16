import type { Metadata } from "next";
import { LandingNav, LandingFooter } from "@/components/LandingShell";
import ContactSection from "@/components/ContactSection";

export const metadata: Metadata = {
  title: "Contact Us | LexRam",
  description: "Get in touch with the LexRam team — book a demo, ask about Research, Drafting, or TSR.",
  alternates: { canonical: "https://lexram.ai/contact" },
  openGraph: {
    title: "Contact Us | LexRam",
    description: "Book a demo or ask about LexRam Research, Drafting, or TSR.",
    url: "https://lexram.ai/contact",
    siteName: "LexRam",
    locale: "en_IN",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#d8cdb8]">
      <LandingNav />
      <main className="pt-16">
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  );
}
