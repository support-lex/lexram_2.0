'use client';
import { Scale } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-sidebar)] text-[var(--text-muted)] py-16 px-4 sm:px-6 lg:px-8 border-t border-[var(--border-default)]">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 text-white mb-6">
            <Scale className="w-6 h-6 text-[var(--accent)]" />
            <span className="font-serif font-bold text-xl tracking-tight">LexRam</span>
          </Link>
          <p className="text-sm font-normal leading-relaxed font-sans">
            The most advanced legal AI built exclusively for Indian advocates, law firms, and chambers.
          </p>
        </div>
        <div>
          <h4 className="text-[var(--text-primary)] font-medium mb-6 tracking-wide text-sm font-sans">Product</h4>
          <ul className="space-y-4 text-sm font-normal font-sans">
            <li><a href="#research" className="hover:text-[var(--text-primary)] transition-colors">Deep Research</a></li>
            <li><a href="#drafting" className="hover:text-white transition-colors">Drafting Suite</a></li>
            <li><a href="#practice-areas" className="hover:text-white transition-colors">Practice Areas</a></li>
            <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[var(--text-primary)] font-medium mb-6 tracking-wide text-sm font-sans">Company</h4>
          <ul className="space-y-4 text-sm font-normal font-sans">
            <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
            <li><a href="/careers" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[var(--text-primary)] font-medium mb-6 tracking-wide text-sm font-sans">Legal</h4>
          <ul className="space-y-4 text-sm font-normal font-sans">
            <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
            <li><a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 border-t border-[var(--border-default)] text-sm font-normal flex flex-col md:flex-row justify-between items-center gap-4 font-sans">
        <p>© 2026 LexRam Technologies. All rights reserved.</p>
        <p className="text-xs text-[var(--text-muted)]/60">Powered by Ramasubramanian AI Software Pvt. Ltd.</p>
        <div className="flex gap-6">
          <a href="https://twitter.com/lexram" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Follow LexRam on Twitter">Twitter</a>
          <a href="https://linkedin.com/company/lexram" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Follow LexRam on LinkedIn">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}
