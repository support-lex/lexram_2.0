import { Scale, FolderOpen, ArrowLeft, Sparkles } from 'lucide-react'

export default function TsrWelcomePage() {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-full px-6 text-center bg-cream overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-rust/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-maroon/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #680318 1px, transparent 1px), linear-gradient(to bottom, #680318 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse at center, black 35%, transparent 75%)',
        }}
      />

      <div className="relative z-10 max-w-xl">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-7 mx-auto bg-maroon shadow-[0_18px_40px_-16px_rgba(104,3,24,0.55)]">
          <Scale className="w-9 h-9 text-cream" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-maroon/10 border border-maroon/15 text-maroon text-[11px] font-medium tracking-[0.18em] uppercase mb-5">
          <Sparkles size={12} className="text-rust" />
          Welcome
        </div>

        <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.05] text-maroon">
          Welcome to <span className="italic text-rust">LEXRAM TSR</span>
        </h1>

        <p className="text-ink/70 max-w-md mx-auto leading-relaxed mt-5 text-base">
          Select a client from the sidebar to view their scrutiny report, or
          create a new client to grant a fresh Title Scrutiny Report.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-md w-full mx-auto mt-10">
          <div className="flex-1 rounded-2xl border border-maroon/15 bg-cream-soft p-5 text-left shadow-[0_18px_40px_-30px_rgba(104,3,24,0.4)] hover:border-maroon/30 hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-maroon grid place-items-center text-cream shadow-md">
                <FolderOpen className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-maroon font-display">
                Open a client
              </span>
            </div>
            <p className="text-xs text-ink/60 leading-relaxed">
              Click any client in the left panel to open their file and view
              the scrutiny report.
            </p>
          </div>

          <div className="flex-1 rounded-2xl border border-maroon/15 bg-cream-soft p-5 text-left shadow-[0_18px_40px_-30px_rgba(104,3,24,0.4)] hover:border-maroon/30 hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-rust grid place-items-center text-cream shadow-md">
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </div>
              <span className="text-sm font-semibold text-maroon font-display">
                New client
              </span>
            </div>
            <p className="text-xs text-ink/60 leading-relaxed">
              Click <strong className="text-rust">+ New Client</strong> at the
              top of the sidebar to grant a fresh report.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
