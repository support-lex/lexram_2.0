import LegalPageLayout from "@/components/layout/LegalPageLayout";

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
    <LegalPageLayout 
      title="Careers at LexRam" 
      icon="Briefcase"
    >
      <p className="mb-6 text-[#680318]/70">
        We&apos;re building the future of legal technology. If you&apos;re passionate 
        about AI, law, and making a real impact, we&apos;d love to hear from you.
      </p>

      <h2 className="font-serif text-xl font-bold text-[#680318] mt-8 mb-4">
        Open Positions
      </h2>
      
      <div className="space-y-4 mb-8">
        {positions.map((position, index) => (
          <div 
            key={index} 
            className="p-6 bg-white rounded-xl border border-[#680318]/10 shadow-sm"
          >
            <h3 className="font-serif font-bold text-[#680318]">{position.title}</h3>
            <p className="text-[#680318]/60 mt-1 text-sm">{position.location}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 rounded-xl bg-[#b94826]/8 border border-[#b94826]/20 text-center">
        <p className="text-[#680318] font-medium mb-4">
          Interested in joining our team?
        </p>
        <a 
          href="mailto:careers@lexram.ai" 
          className="inline-block px-6 py-2.5 bg-[#680318] text-[#fff0df] rounded-lg text-sm font-semibold hover:bg-[#b94826] transition-colors"
        >
          Send your resume
        </a>
      </div>
    </LegalPageLayout>
  );
}
