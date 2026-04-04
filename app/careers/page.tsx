import SimplePageLayout from "@/components/layout/SimplePageLayout";
import { Briefcase } from "lucide-react";

export const metadata = {
  title: "Careers | LexRam",
  description: "Join the LexRam team - Building the future of legal AI",
};

export default function CareersPage() {
  const positions = [
    { title: "Senior Full-Stack Engineer", location: "Bangalore / Remote" },
    { title: "Legal Research Analyst", location: "Delhi / Mumbai" },
    { title: "AI/ML Engineer", location: "Bangalore" },
  ];

  return (
    <SimplePageLayout 
      title="Careers at LexRam" 
      description="Join us in transforming the legal industry"
      icon={Briefcase}
    >
      <p className="mb-6">
        We&apos;re building the future of legal technology. If you&apos;re passionate 
        about AI, law, and making a real impact, we&apos;d love to hear from you.
      </p>

      <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] mt-8 mb-4">
        Open Positions
      </h2>
      
      <div className="space-y-4 mb-8">
        {positions.map((position, index) => (
          <div 
            key={index} 
            className="p-6 bg-white rounded-lg shadow-sm border border-[var(--border-default)]"
          >
            <h3 className="font-serif font-bold text-[var(--text-primary)]">{position.title}</h3>
            <p className="text-[var(--text-secondary)] mt-2">{position.location}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-[var(--accent)]/10 rounded-lg border border-[var(--accent)]/20 text-center">
        <p className="text-[var(--text-primary)] font-medium mb-4">
          Interested in joining our team?
        </p>
        <a 
          href="mailto:careers@lexram.ai" 
          className="inline-block px-6 py-3 bg-[var(--bg-sidebar)] text-white rounded-lg hover:bg-[var(--bg-sidebar-hover)] transition-colors"
        >
          Send your resume
        </a>
      </div>
    </SimplePageLayout>
  );
}
