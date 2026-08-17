"use client";

// Renders blog HTML and hydrates Mermaid diagrams in-place.
//
// We can't tag mermaid blocks with a class (e.g. "lexram-mermaid") because
// TipTap's StarterKit codeBlock normalizes every <pre> to its own configured
// class on save, so any custom marker gets stripped between edit and view.
// Instead we detect by content: any <pre> whose first non-empty line starts
// with a Mermaid diagram keyword (graph, flowchart, sequenceDiagram, …) is
// rendered as a live SVG. Plain code blocks are untouched.

import { useEffect, useRef } from "react";

// Mermaid's recognized top-level diagram keywords. Anchored to the start of
// the source after trimming, so a code block that just *mentions* "graph"
// in its first comment doesn't get hijacked.
const MERMAID_PREFIX_RE =
  /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(-v2)?|erDiagram|journey|gantt|pie|requirementDiagram|gitGraph|C4Context|mindmap|timeline|sankey-beta|quadrantChart|xychart-beta|block-beta)\b/;

function looksLikeMermaid(source: string): boolean {
  return MERMAID_PREFIX_RE.test(source.trim());
}

interface Props {
  html: string;
}

let _mermaidReady: Promise<typeof import("mermaid")["default"]> | null = null;
function getMermaid() {
  if (!_mermaidReady) {
    _mermaidReady = import("mermaid").then((mod) => {
      const m = mod.default;
      const isDark =
        typeof document !== "undefined" &&
        (document.documentElement.dataset.theme === "midnight" ||
          document.documentElement.dataset.theme === "futuristic");
      m.initialize({
        startOnLoad: false,
        theme: "base",
        securityLevel: "loose",
        fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
        flowchart: { htmlLabels: true, curve: "monotoneX", nodeSpacing: 60, rankSpacing: 100, padding: 24 },
        themeVariables: {
          background: isDark ? "#151B2B" : "#FDFBF7",
          primaryColor: isDark ? "#1E2D45" : "#FDF6E8",
          primaryBorderColor: "#C6A76E",
          primaryTextColor: isDark ? "#E2E8F0" : "#1F1F1F",
          lineColor: isDark ? "#4B5563" : "#9CA3AF",
        },
      });
      return m;
    });
  }
  return _mermaidReady;
}

export default function BlogContent({ html }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const candidates = Array.from(root.querySelectorAll<HTMLElement>("pre"));
    const blocks = candidates.filter((el) => looksLikeMermaid(el.textContent ?? ""));
    if (blocks.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const mermaid = await getMermaid();
        for (let i = 0; i < blocks.length; i++) {
          if (cancelled) return;
          const el = blocks[i];
          // textContent strips the inner <code> wrapper TipTap sometimes adds,
          // and unescapes the entities we wrote on the server.
          const source = (el.textContent ?? "").trim();
          if (!source) continue;
          const id = `lexram-mermaid-${Date.now()}-${i}`;
          try {
            const { svg } = await mermaid.render(id, source);
            const wrap = document.createElement("div");
            wrap.className = "lexram-mermaid-rendered my-6 flex justify-center overflow-x-auto";
            wrap.innerHTML = svg;
            el.replaceWith(wrap);
          } catch (err) {
            // Leave the source block in place so the lawyer can see (and copy)
            // the mermaid the AI produced when it fails to render.
            console.warn("[BlogContent] mermaid render failed", err);
          }
        }
      } catch (err) {
        console.warn("[BlogContent] mermaid load failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="blog-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
