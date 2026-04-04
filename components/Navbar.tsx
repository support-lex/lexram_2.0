'use client';
import { Scale, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[var(--bg-sidebar)]/90 backdrop-blur-xl border-b border-[var(--border-default)] py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-[var(--accent)]" aria-hidden="true" />
            <span className="font-serif font-bold text-xl tracking-tight text-white">
              LexRam
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#research" className="font-sans text-sm font-normal tracking-wide text-[var(--text-on-sidebar)]/80 hover:text-[var(--text-on-sidebar)] transition-colors">Research</a>
            <a href="#drafting" className="font-sans text-sm font-normal tracking-wide text-[var(--text-on-sidebar)]/80 hover:text-[var(--text-on-sidebar)] transition-colors">Drafting</a>
            <a href="#practice-areas" className="font-sans text-sm font-normal tracking-wide text-[var(--text-on-sidebar)]/80 hover:text-[var(--text-on-sidebar)] transition-colors">Practice Areas</a>
            <a href="#pricing" className="font-sans text-sm font-normal tracking-wide text-[var(--text-on-sidebar)]/80 hover:text-[var(--text-on-sidebar)] transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/sign-in" className="font-sans text-sm font-normal tracking-wide text-[var(--text-on-sidebar)]/80 hover:text-[var(--text-on-sidebar)] transition-colors">
              Sign In
            </Link>
            <Link href="/sign-in" className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors tracking-wide">
              Get Started
            </Link>
          </div>

          <button className="md:hidden p-2 text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"} title={isMobileMenuOpen ? "Close menu" : "Open menu"}>
            {isMobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[var(--bg-sidebar)] border-b border-[var(--border-default)] px-4 pt-4 pb-6 space-y-2 absolute top-full left-0 w-full">
          <a href="#research" className="block px-4 py-3 font-sans text-base font-normal text-[var(--text-on-sidebar)]/80 hover:bg-[var(--bg-sidebar-hover)] rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>Research</a>
          <a href="#drafting" className="block px-4 py-3 font-sans text-base font-normal text-[var(--text-on-sidebar)]/80 hover:bg-[var(--bg-sidebar-hover)] rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>Drafting</a>
          <a href="#practice-areas" className="block px-4 py-3 font-sans text-base font-normal text-[var(--text-on-sidebar)]/80 hover:bg-[var(--bg-sidebar-hover)] rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>Practice Areas</a>
          <a href="#pricing" className="block px-4 py-3 font-sans text-base font-normal text-[var(--text-on-sidebar)]/80 hover:bg-[var(--bg-sidebar-hover)] rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
          <div className="pt-4 flex flex-col gap-3 px-2">
            <Link href="/sign-in" className="w-full text-center px-4 py-3 font-sans text-base font-normal text-white border border-white/20 rounded-xl">Sign In</Link>
            <Link href="/sign-in" className="w-full text-center px-4 py-3 text-base font-medium text-black bg-white rounded-xl">Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
