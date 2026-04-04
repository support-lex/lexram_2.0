'use client';

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TrustStrip from '@/components/TrustStrip';
import ProblemSection from '@/components/ProblemSection';
import ResearchSection from '@/components/ResearchSection';
import DraftingSection from '@/components/DraftingSection';
import PracticeAreasSection from '@/components/PracticeAreasSection';
import UserStoriesSection from '@/components/UserStoriesSection';
import StatsSection from '@/components/StatsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-black">
      <Navbar />
      <main className="flex-grow" role="main">
        <Hero />
        <TrustStrip />
        <ProblemSection />
        <ResearchSection />
        <DraftingSection />
        <PracticeAreasSection />
        <UserStoriesSection />
        <StatsSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
