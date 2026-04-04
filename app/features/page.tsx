import PageLayout from "@/components/layout/PageLayout";
import Link from "next/link";
import { 
  Search, 
  FileText, 
  Scale, 
  Clock, 
  Shield, 
  Sparkles,
  ArrowRight
} from "lucide-react";

export const metadata = {
  title: "Features | LexRam",
  description: "Explore LexRam's powerful AI features for legal professionals",
};

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}

const features: Feature[] = [
  {
    icon: <Search className="w-8 h-8 text-[var(--accent)]" />,
    title: "AI-Powered Legal Research",
    description: "Search across millions of cases, statutes, and legal commentary with natural language queries.",
    benefits: [
      "Natural language search",
      "Case law analysis",
      "Statute interpretation",
      "Citation verification"
    ]
  },
  {
    icon: <FileText className="w-8 h-8 text-[var(--accent)]" />,
    title: "Intelligent Drafting",
    description: "Draft legal documents faster with AI assistance tailored to Indian legal formats.",
    benefits: [
      "Contract templates",
      "Pleadings and motions",
      "Legal opinions",
      "Custom document generation"
    ]
  },
  {
    icon: <Scale className="w-8 h-8 text-[var(--accent)]" />,
    title: "Case Analysis",
    description: "Analyze case strengths, weaknesses, and outcomes with AI-powered insights.",
    benefits: [
      "Merit assessment",
      "Precedent analysis",
      "Risk evaluation",
      "Strategy recommendations"
    ]
  },
  {
    icon: <Clock className="w-8 h-8 text-[var(--accent)]" />,
    title: "Deadline Management",
    description: "Never miss a deadline with automated tracking and reminders for all your matters.",
    benefits: [
      "Automated deadline calculation",
      "Court-wise schedules",
      "Smart reminders",
      "Calendar integration"
    ]
  },
  {
    icon: <Shield className="w-8 h-8 text-[var(--accent)]" />,
    title: "Secure Document Handling",
    description: "Bank-grade security for all your sensitive legal documents and client data.",
    benefits: [
      "End-to-end encryption",
      "Access controls",
      "Audit logs",
      "Compliance ready"
    ]
  },
  {
    icon: <Sparkles className="w-8 h-8 text-[var(--accent)]" />,
    title: "AI Assistant",
    description: "Get instant answers to legal questions from our specialized Indian law AI.",
    benefits: [
      "24/7 availability",
      "Multi-language support",
      "Citation-backed answers",
      "Continuous learning"
    ]
  }
];

export default function FeaturesPage() {
  return (
    <PageLayout fullWidth>
      {/* Hero */}
      <div className="bg-[var(--bg-sidebar)] text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-serif font-bold mb-6">
            Powerful Features for <span className="text-[var(--accent)]">Legal Professionals</span>
          </h1>
          <p className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
            Everything you need to research, draft, and manage your legal practice more efficiently.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-lg shadow-sm border border-[var(--border-default)] hover:shadow-lg transition-shadow"
            >
              <div className="p-3 bg-[var(--bg-surface)] rounded-lg w-fit mb-4">
                {feature.icon}
              </div>
              <h3 className="font-serif text-xl font-bold text-[var(--text-primary)] mb-3">
                {feature.title}
              </h3>
              <p className="text-[var(--text-secondary)] mb-4">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center p-12 bg-[var(--accent)]/10 rounded-2xl border border-[var(--accent)]/20">
          <h2 className="font-serif text-3xl font-bold text-[var(--text-primary)] mb-4">
            Ready to transform your practice?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            Join thousands of Indian advocates who are already using LexRam to work smarter and faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/sign-in"
              className="w-full sm:w-auto px-8 py-4 bg-[var(--bg-sidebar)] text-white rounded-lg hover:bg-[var(--bg-sidebar-hover)] transition-colors flex items-center justify-center gap-2 font-medium"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-white text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
