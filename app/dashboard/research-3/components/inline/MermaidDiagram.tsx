"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  source: string;
}

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

export default function MermaidDiagram({ source }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const latestSeq = useRef(0);

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
    <div className="my-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
      <div
        className="w-full overflow-x-auto py-6 px-4 [&_svg]:h-auto [&_svg]:overflow-visible [&_svg]:pointer-events-none [&_foreignObject]:overflow-visible [&_[class*='zoom']]:!hidden [&_[id*='zoom']]:!hidden"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: svg || `<div style="text-align:center;color:var(--text-muted);font-size:12px;padding:32px 0">Rendering diagram…</div>`,
        }}
      />
    </div>
  );
}
