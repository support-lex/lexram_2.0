import SimplePageLayout from "@/components/layout/SimplePageLayout";
import Link from "next/link";

export const metadata = {
  title: "About Us | LexRam",
  description: "Learn about LexRam - The Legal AI for Indian Advocates",
};

export default function AboutPage() {
  return (
    <SimplePageLayout title="About LexRam">
      <p className="mb-6">
        LexRam is India&apos;s premier AI-powered legal platform, designed specifically 
        for Indian advocates. Our mission is to democratize access to legal intelligence 
        and empower legal professionals with cutting-edge technology.
      </p>
      
      <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] mt-8 mb-4">
        Our Mission
      </h2>
      <p className="mb-6">
        To transform the practice of law in India by providing advocates with 
        intelligent tools that enhance their capabilities, save time, and improve 
        outcomes for their clients.
      </p>

      <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] mt-8 mb-4">
        Why LexRam?
      </h2>
      <ul className="list-disc list-inside space-y-2 mb-8">
        <li>Deep understanding of Indian law and legal procedures</li>
        <li>AI-powered research across all areas of law</li>
        <li>Intelligent drafting assistance for legal documents</li>
        <li>Secure and confidential document handling</li>
        <li>Designed by legal professionals, for legal professionals</li>
      </ul>

      <div className="mt-12 p-6 bg-[var(--accent)]/10 rounded-lg border border-[var(--accent)]/20">
        <p className="text-[var(--text-primary)] font-medium">
          Join thousands of advocates who trust LexRam for their legal research 
          and drafting needs.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-block mt-4 px-6 py-3 bg-[var(--bg-sidebar)] text-white rounded-lg hover:bg-[var(--bg-sidebar-hover)] transition-colors"
        >
          Get Started
        </Link>
      </div>
    </SimplePageLayout>
  );
}
