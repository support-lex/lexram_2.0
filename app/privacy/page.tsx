import SimplePageLayout from "@/components/layout/SimplePageLayout";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | LexRam",
  description: "LexRam Privacy Policy - How we protect your data",
};

export default function PrivacyPage() {
  return (
    <SimplePageLayout 
      title="Privacy Policy" 
      icon={Shield}
      showLastUpdated
    >
      <p className="mb-6">
        At LexRam, we take your privacy seriously. This Privacy Policy explains how we 
        collect, use, and protect your personal information when you use our services.
      </p>

      <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] mt-8 mb-4">
        Information We Collect
      </h2>
      <ul className="list-disc list-inside space-y-2 mb-6">
        <li>Account information (name, email, phone number)</li>
        <li>Professional information (bar council registration, practice area)</li>
        <li>Usage data and interaction with our AI systems</li>
        <li>Documents uploaded for analysis (processed securely)</li>
      </ul>

      <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] mt-8 mb-4">
        How We Use Your Information
      </h2>
      <ul className="list-disc list-inside space-y-2 mb-6">
        <li>To provide and improve our legal AI services</li>
        <li>To personalize your experience</li>
        <li>To communicate important updates</li>
        <li>To ensure security and prevent fraud</li>
      </ul>

      <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] mt-8 mb-4">
        Data Security
      </h2>
      <p className="mb-6">
        We implement industry-standard security measures including encryption, 
        secure servers, and regular security audits. Your legal documents are 
        processed confidentially and never used to train our AI models without 
        explicit consent.
      </p>

      <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] mt-8 mb-4">
        Contact Us
      </h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at{" "}
        <a href="mailto:privacy@lexram.ai" className="text-[var(--accent)] hover:underline">
          privacy@lexram.ai
        </a>
      </p>
    </SimplePageLayout>
  );
}
