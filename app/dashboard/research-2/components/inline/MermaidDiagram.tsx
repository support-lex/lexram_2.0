"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";

// Detect active LexRam theme from the <html data-theme="..."> attribute.
function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const t = document.documentElement.dataset.theme ?? "";
  return t === "midnight" || t === "futuristic" ? "dark" : "light";
}

// Singleton init — mermaid.initialize() is not idempotent; calling it on every
// render resets the config and can break in-flight renders.
let _mermaidReady: Promise<typeof import("mermaid")["default"]> | null = null;

function getMermaid() {
  if (!_mermaidReady) {
    _mermaidReady = import("mermaid").then((mod) => {
      const m = mod.default;
      const dark = getTheme() === "dark";

      m.initialize({
        startOnLoad: false,
        theme: "base",
        securityLevel: "loose",
        fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
        flowchart: {
          htmlLabels: true,
          curve: "monotoneX",
          nodeSpacing: 60,
          rankSpacing: 100,
          padding: 24,
        },
        themeVariables: {
          background:           dark ? "#151B2B" : "#FDFBF7",
          primaryColor:         dark ? "#1E2D45" : "#FDF6E8",
          primaryBorderColor:   dark ? "#C6A76E" : "#C6A76E",
          primaryTextColor:     dark ? "#E2E8F0" : "#1F1F1F",
          secondaryColor:       dark ? "#162035" : "#EEF6EE",
          secondaryBorderColor: dark ? "#22C55E" : "#16A34A",
          secondaryTextColor:   dark ? "#BBF7D0" : "#14532D",
          tertiaryColor:        dark ? "#2A1F10" : "#FFF7ED",
          tertiaryBorderColor:  dark ? "#F59E0B" : "#D97706",
          tertiaryTextColor:    dark ? "#FDE68A" : "#92400E",
          lineColor:            dark ? "#4B5563" : "#9CA3AF",
          edgeLabelBackground:  dark ? "#1E293B" : "#F9F6F0",
          fontSize: "14px",
          clusterBkg:           dark ? "#1A2335" : "#F5F0E8",
          clusterBorder:        dark ? "#2D3E55" : "#E8E2D8",
          titleColor:           dark ? "#E2E8F0" : "#1F1F1F",
        },
      });
      return m;
    });
  }
  return _mermaidReady;
}

let _seq = 0;

function inferTitle(source: string): string {
  const first = source.trim().split("\n")[0].toLowerCase();
  if (first.includes("flowchart") || first.includes("graph")) return "Precedent Map";
  if (first.includes("mindmap")) return "Mind Map";
  if (first.includes("timeline")) return "Timeline";
  if (first.includes("sequencediagram")) return "Sequence";
  return "Diagram";
}

interface MermaidDiagramProps {
  source: string;
}

export default function MermaidDiagram({ source }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const latestSeq = useRef(0);

  // createPortal needs a DOM target; only available after mount.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close fullscreen with ESC.
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", handler);
    // Lock background scroll while the overlay is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);

  const diagramTitle = inferTitle(source);

  useEffect(() => {
    if (!source?.trim()) return;

    const timer = setTimeout(async () => {
      const seq = ++_seq;
      latestSeq.current = seq;
      setError(null);
      setSvg("");

      try {
        const mermaid = await getMermaid();
        const renderId = `mmd-${seq}`;
        const { svg: rendered } = await mermaid.render(renderId, source.trim());
        document.getElementById(renderId)?.remove();
        if (latestSeq.current === seq) setSvg(rendered);
      } catch (err: any) {
        if (latestSeq.current === seq) {
          console.warn("[MermaidDiagram] render failed", err);
          setError(err?.message ?? "Could not render diagram");
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [source]);

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-xs text-amber-700">
        <div className="font-semibold mb-1">Diagram failed to render</div>
        <pre className="whitespace-pre-wrap font-mono text-[11px] opacity-80">{source}</pre>
      </div>
    );
  }

  return (
    <>
      {/* Inline preview — click anywhere on the diagram to open fullscreen */}
      <div className="my-3 group/diagram relative rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => svg && setFullscreen(true)}
          disabled={!svg}
          aria-label={`Open ${diagramTitle} fullscreen`}
          title="Click to view fullscreen"
          className="absolute inset-0 z-10 cursor-zoom-in disabled:cursor-default"
        />
        {/* Hint pill on hover */}
        {svg && (
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover/diagram:opacity-100 transition-opacity pointer-events-none">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--lex-maroon)] text-[var(--lex-cream)] text-[10px] font-semibold shadow-md">
              <Maximize2 className="w-3 h-3" /> Fullscreen
            </span>
          </div>
        )}
        <div
          className="w-full overflow-x-auto py-6 px-4 [&_svg]:h-auto [&_svg]:overflow-visible [&_svg]:pointer-events-none [&_foreignObject]:overflow-visible [&_[class*='zoom']]:!hidden [&_[id*='zoom']]:!hidden"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: svg || `<div style="text-align:center;color:var(--text-muted);font-size:12px;padding:32px 0">Rendering diagram…</div>`,
          }}
        />
      </div>

      {/* Full-window overlay rendered via portal — attaches directly to
          <body> so `fixed inset-0` is positioned relative to the viewport
          (not to any ancestor that creates a containing block via
          transform / backdrop-filter / filter / will-change). */}
      {mounted && fullscreen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${diagramTitle} full window view`}
          className="fixed inset-0 z-[100] bg-white flex flex-col lex-animate-fade-in"
        >
          {/* Title bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-light)] bg-[var(--lex-cream-soft)] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-[var(--lex-maroon)]" />
              <h2 className="font-serif text-base font-bold text-[var(--lex-maroon)]">{diagramTitle}</h2>
            </div>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="Close full window view"
              className="grid place-items-center size-9 rounded-full text-[var(--text-muted)] hover:bg-[var(--lex-cream-deep)] hover:text-[var(--lex-maroon)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Full-window diagram — SVG scaled to fill the viewport */}
          <div
            className="flex-1 overflow-auto p-6 sm:p-10 bg-white [&_svg]:max-w-full [&_svg]:h-auto [&_foreignObject]:overflow-visible"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>,
        document.body
      )}
    </>
  );
}
