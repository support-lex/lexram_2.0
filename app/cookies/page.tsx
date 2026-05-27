import LegalPageLayout from "@/components/layout/LegalPageLayout";

export const metadata = {
  title: "Cookie Policy | LexRam",
  description: "LexRam Cookie Policy - How we use cookies",
};

export default function CookiesPage() {
  return (
    <LegalPageLayout 
      title="Cookie Policy" 
      icon="Cookie"
    >
      <p className="mb-6 text-sm text-[#680318]/60">Last updated: March 2025</p>

      <p className="mb-6 text-[#680318]/70">
        This Cookie Policy explains how LexRam uses cookies and similar technologies 
        to recognize you when you visit our platform.
      </p>

      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        What Are Cookies
      </h2>
      <p className="mb-6 text-[#680318]/70">
        Cookies are small data files that are placed on your computer or mobile device 
        when you visit a website. They help the website recognize your device and store 
        information about your preferences.
      </p>

      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        How We Use Cookies
      </h2>
      <ul className="list-disc list-inside space-y-2 mb-6 text-[#680318]/70">
        <li><strong>Essential cookies:</strong> Required for the platform to function properly</li>
        <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
        <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our platform</li>
        <li><strong>Security cookies:</strong> Help protect your account and our platform</li>
      </ul>

      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        Managing Cookies
      </h2>
      <p className="mb-6 text-[#680318]/70">
        Most web browsers allow you to control cookies through their settings. However, 
        if you disable cookies, some features of LexRam may not function properly.
      </p>

      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        Contact Us
      </h2>
      <p className="text-[#680318]/70">
        If you have questions about our Cookie Policy, please contact us at{" "}
        <a href="mailto:privacy@lexram.ai" className="text-[#b94826] hover:underline">
          privacy@lexram.ai
        </a>
      </p>
    </LegalPageLayout>
  );
}
