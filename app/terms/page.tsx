import LegalPageLayout from "@/components/layout/LegalPageLayout";

export const metadata = {
  title: "Terms of Service | LexRam",
  description: "LexRam Terms of Service - Terms and conditions for using our platform",
};

export default function TermsPage() {
  return (
    <LegalPageLayout 
      title="Terms of Service" 
      icon="FileText"
    >
      <p className="mb-6 text-sm text-[#680318]/60">Last updated: March 2025</p>

      <p className="mb-6 text-[#680318]/70">
        Welcome to LexRam. By accessing or using our services, you agree to be bound 
        by these Terms of Service. Please read them carefully.
      </p>

      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        1. Acceptance of Terms
      </h2>
      <p className="mb-6 text-[#680318]/70">
        By accessing or using LexRam&apos;s services, you agree to these Terms of Service 
        and our Privacy Policy. If you do not agree, please do not use our services.
      </p>

      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        2. Eligibility
      </h2>
      <p className="mb-6 text-[#680318]/70">
        LexRam is designed for licensed legal professionals in India. You must be 
        enrolled with a State Bar Council to use our services. By using LexRam, you 
        represent that you meet these eligibility requirements.
      </p>

      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        3. Use of Services
      </h2>
      <p className="mb-6 text-[#680318]/70">
        Our AI-powered tools are designed to assist legal professionals. However, 
        LexRam does not provide legal advice. You are responsible for reviewing and 
        verifying all AI-generated content before use in legal proceedings.
      </p>

      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        4. Account Security
      </h2>
      <p className="mb-6 text-[#680318]/70">
        You are responsible for maintaining the confidentiality of your account 
        credentials and for all activities that occur under your account.
      </p>

      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        5. Contact
      </h2>
      <p className="text-[#680318]/70">
        For questions about these Terms, contact us at{" "}
        <a href="mailto:legal@lexram.ai" className="text-[#b94826] hover:underline">
          legal@lexram.ai
        </a>
      </p>
    </LegalPageLayout>
  );
}
