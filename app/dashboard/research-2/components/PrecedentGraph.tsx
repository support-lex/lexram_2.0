"use client";

import { useState, useRef, useCallback } from "react";
import { Maximize2, X, ExternalLink, GitMerge } from "lucide-react";
import type { PrecedentGraph as PrecedentGraphData, PrecedentGraphNode, PrecedentGraphEdge } from "../types";

// ── Layout constants ───────────────────────────────────────────────────────────
const NODE_W = 170;
const NODE_H = 80;
const COL_GAP = 230;
const ROW_GAP = 22;
const PADDING = 48;

// ── Color maps ─────────────────────────────────────────────────────────────────
const EDGE_COLOR: Record<string, string> = {
  followed: "#16a34a",
  overruled: "#dc2626",
  reliedOn: "#d97706",
  neutral: "#94a3b8",
};

const NODE_BG: Record<string, string> = {
  followed: "#f0fdf4",
  overruled: "#fff1f2",
  reliedOn: "#fffbeb",
  neutral: "#f8fafc",
};

const NODE_BORDER: Record<string, string> = {
  followed: "#16a34a",
  overruled: "#dc2626",
  reliedOn: "#d97706",
  neutral: "#cbd5e1",
};

const NODE_TEXT: Record<string, string> = {
  followed: "#14532d",
  overruled: "#991b1b",
  reliedOn: "#78350f",
  neutral: "#334155",
};

const BUCKET_LABEL: Record<string, string> = {
  followed: "FOLLOWED",
  overruled: "OVERRULED",
  reliedOn: "RELIED ON",
  neutral: "DISTINGUISHED",
};

// ── Layout calculator ─────────────────────────────────────────────────────────
function computeLayout(nodes: PrecedentGraphNode[]) {
  const yearGroups = new Map<string, PrecedentGraphNode[]>();
  for (const n of nodes) {
    const y = n.year || "0000";
    if (!yearGroups.has(y)) yearGroups.set(y, []);
    yearGroups.get(y)!.push(n);
  }

  const sortedYears = Array.from(yearGroups.keys()).sort();
  const positions = new Map<string, { x: number; y: number }>();

  const maxColSize = Math.max(...Array.from(yearGroups.values()).map((g) => g.length));
  const totalH = maxColSize * NODE_H + Math.max(0, maxColSize - 1) * ROW_GAP;
  const centerY = PADDING + totalH / 2;

  sortedYears.forEach((year, colIdx) => {
    const group = yearGroups.get(year)!;
    const colH = group.length * NODE_H + Math.max(0, group.length - 1) * ROW_GAP;
    const startY = centerY - colH / 2;
    group.forEach((node, rowIdx) => {
      positions.set(node.id, {
        x: PADDING + colIdx * COL_GAP,
        y: startY + rowIdx * (NODE_H + ROW_GAP),
      });
    });
  });

  const allPos = Array.from(positions.values());
  const width = allPos.length ? Math.max(...allPos.map((p) => p.x)) + NODE_W + PADDING : 300;
  const height = allPos.length ? Math.max(...allPos.map((p) => p.y)) + NODE_H + PADDING : 200;
  return { positions, width, height };
}

// ── Bezier edge path ──────────────────────────────────────────────────────────
function edgePath(
  fx: number, fy: number,
  tx: number, ty: number,
): string {
  const sx = fx + NODE_W;
  const sy = fy + NODE_H / 2;
  const ex = tx;
  const ey = ty + NODE_H / 2;
  const dx = Math.abs(ex - sx);
  const cp = Math.max(60, dx * 0.4);
  return `M ${sx} ${sy} C ${sx + cp} ${sy}, ${ex - cp} ${ey}, ${ex} ${ey}`;
}

// ── Arrow midpoint for label ──────────────────────────────────────────────────
function edgeMid(
  fx: number, fy: number,
  tx: number, ty: number,
): { x: number; y: number } {
  const sx = fx + NODE_W;
  const sy = fy + NODE_H / 2;
  const ex = tx;
  const ey = ty + NODE_H / 2;
  return { x: (sx + ex) / 2, y: (sy + ey) / 2 };
}

// ── Tooltip component ─────────────────────────────────────────────────────────
function Tooltip({ x, y, children, width = 240 }: {
  x: number; y: number; children: React.ReactNode; width?: number;
}) {
  return (
    <foreignObject
      x={x - width / 2}
      y={y - 8}
      width={width}
      height={1}
      overflow="visible"
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{ pointerEvents: "none" }}
        className="absolute z-50 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-lg p-3 text-[12px] text-[var(--text-primary)] leading-snug max-w-[240px]"
      >
        {children}
      </div>
    </foreignObject>
  );
}

// ── Graph canvas ──────────────────────────────────────────────────────────────
function GraphCanvas({
  data,
  scale = 1,
}: {
  data: PrecedentGraphData;
  scale?: number;
}) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);

  const { positions, width, height } = computeLayout(data.nodes);
  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        {["followed", "overruled", "reliedOn", "neutral"].map((bucket) => (
          <marker
            key={bucket}
            id={`arrow-${bucket}`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L8,3 z" fill={EDGE_COLOR[bucket]} />
          </marker>
        ))}
      </defs>

      {/* Edges */}
      {data.edges.map((edge, i) => {
        const fp = positions.get(edge.from);
        const tp = positions.get(edge.to);
        if (!fp || !tp) return null;
        const color = EDGE_COLOR[edge.bucket] ?? EDGE_COLOR.neutral;
        const mid = edgeMid(fp.x, fp.y, tp.x, tp.y);
        const isHovered = hoveredEdge === i;

        return (
          <g key={`e-${i}`}>
            {/* Wider invisible hit area */}
            <path
              d={edgePath(fp.x, fp.y, tp.x, tp.y)}
              fill="none"
              stroke="transparent"
              strokeWidth={14}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredEdge(i)}
              onMouseLeave={() => setHoveredEdge(null)}
            />
            {/* Visible edge */}
            <path
              d={edgePath(fp.x, fp.y, tp.x, tp.y)}
              fill="none"
              stroke={color}
              strokeWidth={isHovered ? 2.5 : 1.8}
              strokeDasharray={edge.bucket === "neutral" ? "5 3" : undefined}
              markerEnd={`url(#arrow-${edge.bucket})`}
              opacity={isHovered ? 1 : 0.75}
              style={{ cursor: "pointer", transition: "stroke-width 0.15s, opacity 0.15s" }}
              onMouseEnter={() => setHoveredEdge(i)}
              onMouseLeave={() => setHoveredEdge(null)}
            />
            {/* Edge label pill */}
            {isHovered && (
              <g>
                <rect
                  x={mid.x - 36}
                  y={mid.y - 10}
                  width={72}
                  height={20}
                  rx={6}
                  fill={color}
                  opacity={0.92}
                />
                <text
                  x={mid.x}
                  y={mid.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize={9}
                  fontWeight={700}
                  letterSpacing={0.5}
                  style={{ pointerEvents: "none" }}
                >
                  {BUCKET_LABEL[edge.bucket] ?? edge.label}
                </text>
              </g>
            )}
            {/* Edge hover tooltip with context */}
            {isHovered && edge.context && (
              <Tooltip x={mid.x} y={mid.y + 16} width={260}>
                <div className="font-semibold mb-1" style={{ color }}>
                  {BUCKET_LABEL[edge.bucket] ?? edge.label}
                </div>
                <div className="text-[var(--text-secondary)] leading-relaxed">
                  {edge.context.length > 220 ? edge.context.slice(0, 220) + "…" : edge.context}
                </div>
              </Tooltip>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {data.nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        const isHovered = hoveredNode === node.id;
        const bg = NODE_BG[node.cls] ?? NODE_BG.neutral;
        const border = NODE_BORDER[node.cls] ?? NODE_BORDER.neutral;
        const textColor = NODE_TEXT[node.cls] ?? NODE_TEXT.neutral;

        const titleLine = node.title.length > 30 ? node.title.slice(0, 28) + "…" : node.title;
        const decisionLine = node.decision
          ? node.decision.length > 55
            ? node.decision.slice(0, 53) + "…"
            : node.decision
          : "";

        return (
          <g
            key={node.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            style={{ cursor: node.source_url ? "pointer" : "default" }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => {
              if (node.source_url) window.open(node.source_url, "_blank", "noopener,noreferrer");
            }}
          >
            {/* Node shadow */}
            {isHovered && (
              <rect
                x={-2} y={-2} width={NODE_W + 4} height={NODE_H + 4}
                rx={13} fill={border} opacity={0.15}
              />
            )}
            {/* Node rect */}
            <rect
              x={0} y={0} width={NODE_W} height={NODE_H}
              rx={11}
              fill={bg}
              stroke={border}
              strokeWidth={isHovered ? 2 : 1.5}
            />
            {/* Seed indicator */}
            {node.is_seed && (
              <rect x={0} y={0} width={NODE_W} height={3} rx={11} fill={border} opacity={0.6} />
            )}
            {/* Overruled strikethrough line */}
            {node.is_overruled && (
              <line
                x1={12} y1={NODE_H / 2}
                x2={NODE_W - 12} y2={NODE_H / 2}
                stroke="#dc2626" strokeWidth={1.5} opacity={0.5}
                strokeDasharray="4 3"
              />
            )}
            {/* Year badge */}
            {node.year && (
              <text
                x={NODE_W - 10}
                y={16}
                textAnchor="end"
                fontSize={9}
                fill={border}
                opacity={0.8}
                fontWeight={600}
              >
                {node.year}
              </text>
            )}
            {/* Title */}
            <text
              x={10}
              y={28}
              fontSize={11}
              fontWeight={700}
              fill={textColor}
              style={{ pointerEvents: "none" }}
            >
              {titleLine}
            </text>
            {/* Citation */}
            {node.citation && (
              <text
                x={10}
                y={42}
                fontSize={9.5}
                fill={textColor}
                opacity={0.7}
                style={{ pointerEvents: "none" }}
              >
                {node.citation.length > 36 ? node.citation.slice(0, 34) + "…" : node.citation}
              </text>
            )}
            {/* Decision / Held */}
            {decisionLine && (
              <text
                x={10}
                y={57}
                fontSize={9}
                fill={textColor}
                opacity={0.6}
                style={{ pointerEvents: "none" }}
              >
                {decisionLine}
              </text>
            )}
            {/* Hover tooltip */}
            {isHovered && (
              <Tooltip x={NODE_W / 2} y={NODE_H + 6} width={250}>
                <div className="font-semibold text-[var(--text-primary)] mb-0.5">{node.title}</div>
                {node.citation && (
                  <div className="text-[var(--text-muted)] text-[11px] mb-0.5">{node.citation}</div>
                )}
                {node.decision && (
                  <div className="text-[var(--text-secondary)] mt-1 leading-relaxed">
                    <span className="font-medium">Held: </span>
                    {node.decision}
                  </div>
                )}
                {node.is_overruled && (
                  <div className="mt-1 text-red-600 font-medium text-[11px]">⚠ Overruled</div>
                )}
                {node.source_url && (
                  <div className="mt-1.5 flex items-center gap-1 text-[var(--accent)] text-[11px]">
                    <ExternalLink className="w-3 h-3" /> Click to open
                  </div>
                )}
              </Tooltip>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
export default function PrecedentGraph({ data }: { data: PrecedentGraphData }) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!data.nodes.length) return null;

  const { width, height } = computeLayout(data.nodes);
  // Compact inline view: scale to fit within ~780px wide
  const maxInlineW = 780;
  const inlineScale = Math.min(1, maxInlineW / width);

  return (
    <>
      {/* ── Inline card ── */}
      <div className="mt-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--surface-hover)]">
          <div className="flex items-center gap-2">
            <GitMerge className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
              Precedent Map
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {data.nodes.length} cases · {data.edges.length} citations
            </span>
          </div>
          <button
            onClick={() => setFullscreen(true)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Expand to full screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Expand
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border-light)] flex-wrap">
          {(["followed", "reliedOn", "overruled", "neutral"] as const).map((b) => (
            <span key={b} className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span
                className="inline-block w-4 h-0.5 rounded"
                style={{ background: EDGE_COLOR[b], opacity: b === "neutral" ? 0.6 : 1 }}
              />
              {BUCKET_LABEL[b]}
            </span>
          ))}
          <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] ml-2">
            <span className="inline-block w-3 h-3 rounded border border-[var(--border-default)] bg-[var(--accent)]/20" />
            Seed case
          </span>
        </div>

        {/* Canvas */}
        <div className="overflow-x-auto p-3">
          <GraphCanvas data={data} scale={inlineScale} />
        </div>

        <p className="px-4 pb-2.5 text-[10px] text-[var(--text-muted)]">
          Hover edges for citation context · hover nodes for details · click nodes to open judgment
        </p>
      </div>

      {/* ── Full-screen overlay ── */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setFullscreen(false); }}
        >
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] shadow-2xl flex flex-col"
            style={{ maxWidth: "95vw", maxHeight: "92vh", width: Math.min(width + 96, window.innerWidth * 0.95) }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Precedent Map</span>
                <span className="text-[12px] text-[var(--text-muted)]">
                  {data.nodes.length} cases · {data.edges.length} citations
                </span>
              </div>
              <button
                onClick={() => setFullscreen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-5 py-2 border-b border-[var(--border-light)] flex-shrink-0 flex-wrap">
              {(["followed", "reliedOn", "overruled", "neutral"] as const).map((b) => (
                <span key={b} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <span className="inline-block w-5 h-0.5 rounded" style={{ background: EDGE_COLOR[b] }} />
                  {BUCKET_LABEL[b]}
                </span>
              ))}
            </div>

            {/* Canvas — scrollable */}
            <div className="overflow-auto flex-1 p-4">
              <GraphCanvas data={data} scale={1} />
            </div>

            <p className="px-5 py-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border-light)] flex-shrink-0">
              Hover edges for citation context · hover nodes for details · click nodes to open judgment
            </p>
          </div>
        </div>
      )}
    </>
  );
}
