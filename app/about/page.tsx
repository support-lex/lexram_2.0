import LegalPageLayout from "@/components/layout/LegalPageLayout";
import Link from "next/link";

export const metadata = {
  title: "About Us | LexRam",
  description: "Learn about LexRam - The Legal AI for Indian Advocates",
};

export default function AboutPage() {
  return (
    <LegalPageLayout title="About LexRam" icon="Shield">
      <p className="mb-6 text-[#680318]/70">
        LexRam is India&apos;s premier AI-powered legal platform, designed specifically 
        for Indian advocates. Our mission is to democratize access to legal intelligence 
        and empower legal professionals with cutting-edge technology.
      </p>
      
      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        Our Mission
      </h2>
      <p className="mb-6 text-[#680318]/70">
        To transform the practice of law in India by providing advocates with 
        intelligent tools that enhance their capabilities, save time, and improve 
        outcomes for their clients.
      </p>

      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        Why LexRam?
      </h2>
      <ul className="list-disc list-inside space-y-2 mb-8 text-[#680318]/70">
        <li>Deep understanding of Indian law and legal procedures</li>
        <li>AI-powered research across all areas of law</li>
        <li>Intelligent drafting assistance for legal documents</li>
        <li>Secure and confidential document handling</li>
        <li>Designed by legal professionals, for legal professionals</li>
      </ul>

      <div className="mt-10 p-6 rounded-xl bg-[#b94826]/8 border border-[#b94826]/20">
        <p className="text-[#680318] font-medium">
          Join thousands of advocates who trust LexRam for their legal research 
          and drafting needs.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-block mt-4 px-6 py-2.5 bg-[#680318] text-[#fff0df] rounded-lg text-sm font-semibold hover:bg-[#b94826] transition-colors"
        >
          Get Started
        </Link>
      </div>
    </LegalPageLayout>
  );
}
