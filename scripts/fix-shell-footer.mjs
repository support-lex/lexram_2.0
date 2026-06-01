import { readFileSync, writeFileSync } from "fs";

const file = "components/LandingShell.tsx";
let c = readFileSync(file, "utf8");

const start = c.indexOf("export function LandingFooter()");
if (start === -1) { console.error("not found"); process.exit(1); }

// Keep everything before LandingFooter and replace the rest
const nav = c.slice(0, start);

const newFooter = `export function LandingFooter() {
  const socials = [
    { href: "https://linkedin.com/company/lexram", svgPath: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z", label: "LinkedIn"  },
    { href: "https://youtube.com/@lexram",          svgPath: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z", label: "YouTube"   },
    { href: "https://instagram.com/lexram.ai",      svgPath: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z", label: "Instagram" },
    { href: "https://facebook.com/lexram.ai",       svgPath: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", label: "Facebook"  },
  ];

  return (
    <footer className="bg-[#3a0110] text-[#fff0df]/70 border-t border-[#b94826]/20">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 pt-14 pb-10">

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-12 lg:gap-16">

          {/* Col 1: Brand + contact + social */}
          <div className="flex flex-col gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lexram-logo.png" alt="Lexram" width={130} height={46} className="h-10 w-auto brightness-0 invert" />
            <p className="text-sm leading-relaxed text-[#fff0df]/60 max-w-xs">
              &ldquo;You argue the case. We&apos;ll find the law.&rdquo;<br />
              Built exclusively on India&apos;s courts — statute to submission.
            </p>
            <div className="space-y-3 text-sm">
              <a href="tel:+918754446066" className="flex items-center gap-2.5 text-[#fff0df]/70 hover:text-[#fff0df] transition-colors">
                <Phone className="w-4 h-4 text-[#b94826] shrink-0" />
                +91 87544 46066
              </a>
              <a href="mailto:hello@lexram.ai" className="flex items-center gap-2.5 text-[#fff0df]/70 hover:text-[#fff0df] transition-colors">
                <Mail className="w-4 h-4 text-[#b94826] shrink-0" />
                hello@lexram.ai
              </a>
              <div className="flex items-start gap-2.5 text-[#fff0df]/60">
                <MapPin className="w-4 h-4 text-[#b94826] shrink-0 mt-0.5" />
                <address className="not-italic text-xs leading-[1.8]">
                  G1 (Ground Floor), Bhaskara Apartments,<br />
                  No.&nbsp;28, Pycrofts Garden Road,<br />
                  Nungambakkam, Chennai&nbsp;— 600&nbsp;006
                </address>
              </div>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              {socials.map(({ href, svgPath, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-md border border-[#fff0df]/15 grid place-items-center text-[#fff0df]/55 hover:border-[#b94826] hover:text-[#b94826] hover:bg-[#b94826]/10 transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d={svgPath} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Products */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#b94826] mb-6">Products</p>
            <ul className="space-y-4 text-sm">
              <li><Link href="/#research"       className="text-[#fff0df]/70 hover:text-[#fff0df] transition-colors">Research</Link></li>
              <li><Link href="/#drafting"       className="text-[#fff0df]/70 hover:text-[#fff0df] transition-colors">Drafting</Link></li>
              <li><Link href="/dashboard/tsr"   className="text-[#fff0df]/70 hover:text-[#fff0df] transition-colors">TSR</Link></li>
            </ul>
          </div>

          {/* Col 3: Information */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#b94826] mb-6">Information</p>
            <ul className="space-y-4 text-sm">
              <li><Link href="/blog"    className="text-[#fff0df]/70 hover:text-[#fff0df] transition-colors">Blog</Link></li>
              <li><Link href="/#pricing" className="text-[#fff0df]/70 hover:text-[#fff0df] transition-colors">Pricing</Link></li>
              <li><Link href="/#faq"    className="text-[#fff0df]/70 hover:text-[#fff0df] transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-[#fff0df]/10" />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[#fff0df]/40">
          <span>© {new Date().getFullYear()} Ramasubramanian AI Software Pvt. Ltd. — Built in India, for Indian advocates.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy"       className="hover:text-[#fff0df]/70 transition-colors">Privacy</Link>
            <Link href="/terms"         className="hover:text-[#fff0df]/70 transition-colors">Terms</Link>
            <Link href="/refund-policy" className="hover:text-[#fff0df]/70 transition-colors">Refund</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
`;

// Also update the import line to include Phone, MapPin
const oldImport = `import { ArrowRight, Menu, X, Mail, Phone, MapPin } from "lucide-react";`;
const newImport = `import { ArrowRight, Menu, X, Mail, Phone, MapPin } from "lucide-react";`;

writeFileSync(file, nav + newFooter, "utf8");
console.log("Done — LandingShell footer replaced");
