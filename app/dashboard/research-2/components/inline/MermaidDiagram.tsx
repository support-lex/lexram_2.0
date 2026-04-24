"use client";

import { useEffect, useId, useRef, useState } from "react";

interface MermaidDiagramProps {
  source: string;
}

/**
 * Renders a Mermaid diagram from a source string. The mermaid runtime (~700KB)
 * is dynamically imported on first render so it's not in the initial bundle.
 * Each instance gets a stable unique id derived from useId() so multiple
 * diagrams in the same message don't collide.
 */
export default function MermaidDiagram({ source }: MermaidDiagramProps) {
  const reactId = useId().replace(/[:]/g, "");
  const id = `mmd-${reactId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setSvg("");

    if (!source?.trim()) return;

    (async () => {
      try {
        const mod = await import("mermaid");
        const mermaid = mod.default;
        // Initialise once per page — re-calling is a no-op if already done.
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
          fontFamily: "var(--font-sans, system-ui)",
          themeVariables: {
            primaryColor: "#fff8ed",
            primaryBorderColor: "#d4a017",
            primaryTextColor: "#0f172a",
            lineColor: "#94a3b8",
            fontSize: "13px",
          },
        });
        const { svg: rendered } = await mermaid.render(id, source);
        if (!cancelled) setSvg(rendered);
      } catch (err: any) {
        if (!cancelled) {
          console.warn("[MermaidDiagram] render failed", err);
          setError(err?.message || "Could not render diagram");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, id]);

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-xs text-amber-700">
        <div className="font-semibold mb-1">Diagram failed to render</div>
        <pre className="whitespace-pre-wrap font-mono text-[11px] opacity-80">{source}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container w-full overflow-x-auto py-2 [&_svg]:max-w-full [&_svg]:h-auto"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg || `<div class="text-xs text-[var(--text-muted)] py-4 text-center">Rendering diagram…</div>` }}
    />
  );
}
