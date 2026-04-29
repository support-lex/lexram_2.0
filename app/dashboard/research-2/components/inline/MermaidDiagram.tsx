"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  source: string;
}

// Singleton init — mermaid.initialize() is not idempotent; calling it on every
// render resets the config and can break in-flight renders.
let _mermaidReady: Promise<typeof import("mermaid")["default"]> | null = null;

function getMermaid() {
  if (!_mermaidReady) {
    _mermaidReady = import("mermaid").then((mod) => {
      const m = mod.default;
      m.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose", // required for fa: icon nodes and <br/> in labels
        fontFamily: "var(--font-sans, system-ui)",
        flowchart: {
          htmlLabels: true,
          curve: "basis",
        },
        themeVariables: {
          primaryColor: "#fff8ed",
          primaryBorderColor: "#d4a017",
          primaryTextColor: "#0f172a",
          lineColor: "#94a3b8",
          fontSize: "13px",
        },
      });
      return m;
    });
  }
  return _mermaidReady;
}

// Monotonically increasing counter gives every render() call a unique DOM id,
// preventing mermaid's "element already exists" error when source changes.
let _seq = 0;

export default function MermaidDiagram({ source }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  // Track which render is the latest so stale async results are discarded.
  const latestSeq = useRef(0);

  useEffect(() => {
    if (!source?.trim()) return;

    // Debounce: skip renders while the stream is still writing the diagram.
    const timer = setTimeout(async () => {
      const seq = ++_seq;
      latestSeq.current = seq;
      setError(null);
      setSvg("");

      try {
        const mermaid = await getMermaid();
        const renderId = `mmd-${seq}`;
        const { svg: rendered } = await mermaid.render(renderId, source.trim());

        // Mermaid injects a hidden container into <body> for rendering;
        // remove it immediately to avoid accumulating detached DOM nodes.
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
    <div
      className="mermaid-container w-full overflow-x-auto py-2 [&_svg]:max-w-full [&_svg]:h-auto"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: svg || `<div class="text-xs text-[var(--text-muted)] py-4 text-center">Rendering diagram…</div>`,
      }}
    />
  );
}
