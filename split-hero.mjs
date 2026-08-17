import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('app/page.tsx', 'utf8');

// Find the CTA closing div and the tab card div — split there
// Pattern: close CTAs div, then the tab card comment
const splitPoint = c.indexOf('{/* ── Below: Feature tabs card ───────────────────────────── */}');
if (splitPoint === -1) { console.log('Split point not found'); process.exit(1); }

// Everything from hero open to CTA close = section 1
// Everything from tab card to section close = section 2

// Current section open
const oldSectionOpen = `  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col justify-center">
      {/* Background layers */}
      <div
        aria-hidden
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: \`url(\${parallaxCourt})\`,
          transform: \`translate3d(0, \${y * 0.3}px, 0) scale(1.1)\`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0509]/95 via-[#680318]/80 to-[#2a0a10]/92" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(42,26,28,0.5)_100%)]" />

      <div
        className="relative w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 pt-32 sm:pt-36 md:pt-40 pb-12"
      >`;

const newSectionOpen = `  const BG = (
    <>
      <div
        aria-hidden
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: \`url(\${parallaxCourt})\`,
          transform: \`translate3d(0, \${y * 0.3}px, 0) scale(1.1)\`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0509]/95 via-[#680318]/80 to-[#2a0a10]/92" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(42,26,28,0.5)_100%)]" />
    </>
  );

  return (
    <>
    {/* ── Section 1: Editorial hero ── */}
    <section className="relative min-h-screen overflow-hidden flex flex-col justify-center">
      {BG}
      <div
        className="relative w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 pt-32 sm:pt-36 md:pt-40 pb-16"
      >`;

if (!c.includes(oldSectionOpen)) {
  console.log('OLD SECTION OPEN NOT FOUND');
  // Try to find partial match
  const idx = c.indexOf('return (\n    <section');
  console.log('Partial match at:', idx, JSON.stringify(c.slice(idx, idx+100)));
  process.exit(1);
}
c = c.replace(oldSectionOpen, newSectionOpen);

// Now add scroll hint + close section 1 + open section 2 at the split point
const oldTabStart = `        {/* ── Below: Feature tabs card ───────────────────────────── */}
        <div className="reveal-up w-full max-w-[1200px] mx-auto mt-12 sm:mt-16" style={{ transitionDelay: "160ms" }}>`;

const newTabStart = `      </div>
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#fff0df]/40">
        <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-[#fff0df]/40 to-transparent animate-pulse" />
      </div>
    </section>

    {/* ── Section 2: Animated feature tabs ── */}
    <section className="relative min-h-screen overflow-hidden flex items-center py-20">
      {BG}
      <div className="relative w-full max-w-[1200px] mx-auto px-6 sm:px-10">
        <div className="reveal-up">`;

if (!c.includes(oldTabStart)) {
  console.log('TAB START NOT FOUND');
  const idx = c.indexOf('Below: Feature tabs');
  console.log('Context:', JSON.stringify(c.slice(idx, idx+200)));
  process.exit(1);
}
c = c.replace(oldTabStart, newTabStart);

// Close section 2 — current closing is: </div>\n      </div>\n    </div>\n    </section>
// After split we need:  close tab-reveal div, close tabs wrapper, close section 2, close fragment
const oldClose = `          </div>\n        </div>\n      </div>\n    </div>\n    </section>\n  );`;
const newClose = `          </div>\n        </div>\n      </div>\n      </div>\n    </section>\n    </>\n  );`;

if (!c.includes(oldClose)) {
  console.log('CLOSE NOT FOUND');
  // Try to find the section close
  const idx = c.indexOf('</section>\n  );');
  console.log('Section close at:', idx, JSON.stringify(c.slice(idx-100, idx+30)));
  process.exit(1);
}
c = c.replace(oldClose, newClose);

writeFileSync('app/page.tsx', c, 'utf8');
console.log('Done');
