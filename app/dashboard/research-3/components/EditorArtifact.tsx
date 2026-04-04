'use client';

import { useEffect, useRef, useState } from "react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, BookMarked, Calendar, CheckSquare, Columns2, Copy, Download, Eraser, FileInput, FileText, FileX2, Heading1, Heading2, Heading3, Highlighter, IndentDecrease, IndentIncrease, Italic, Landmark, Link2, Link2Off, List, ListOrdered, Maximize2, MessageSquareQuote, Minus, Palette, Pilcrow, Plus, Printer, Quote, Redo2, RemoveFormatting, Save, ScanLine, Search, Sparkles, Strikethrough, Subscript, Superscript, Table2, Text, Type, Underline, Undo2, X } from "lucide-react";
import { generateContent } from "@/lib/ai";

const CLAUSE_LIBRARY = [
  {
    id: "jurisdiction",
    title: "Jurisdiction Clause",
    category: "Contract",
    content: `<p><strong>Jurisdiction:</strong> This agreement shall be governed by and construed in accordance with the laws of [State/Country], and any disputes arising hereunder shall be subject to the exclusive jurisdiction of the courts of [State/Country].</p>`,
  },
  {
    id: "indemnity",
    title: "Indemnity Clause",
    category: "Contract",
    content: `<p><strong>Indemnity:</strong> Each party shall indemnify, defend, and hold harmless the other party from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to any breach of this agreement by the indemnifying party.</p>`,
  },
  {
    id: "termination",
    title: "Termination Clause",
    category: "Contract",
    content: `<p><strong>Termination:</strong> Either party may terminate this agreement upon [number] days' written notice to the other party. In the event of termination, [provisions regarding payment, deliverables, etc.] shall survive termination.</p>`,
  },
  {
    id: "confidentiality",
    title: "Confidentiality Clause",
    category: "Contract",
    content: `<p><strong>Confidentiality:</strong> Each party agrees to maintain the confidentiality of all proprietary information disclosed by the other party and shall not disclose such information to any third party without prior written consent, except as required by law.</p>`,
  },
  {
    id: "force-majeure",
    title: "Force Majeure Clause",
    category: "Contract",
    content: `<p><strong>Force Majeure:</strong> Neither party shall be liable for any failure or delay in performance due to causes beyond its reasonable control, including but not limited to acts of God, war, strikes, or government regulations.</p>`,
  },
  {
    id: "notice-period",
    title: "Notice Period Clause",
    category: "Employment",
    content: `<p><strong>Notice Period:</strong> Either party may terminate this agreement by providing not less than [number] days' written notice to the other party. The notice period shall commence on the date of receipt of such notice.</p>`,
  },
  {
    id: "non-compete",
    title: "Non-Compete Clause",
    category: "Employment",
    content: `<p><strong>Non-Compete:</strong> During the term of employment and for [period] following termination, the employee shall not engage in any competing business or solicit clients of the employer within [geographic area].</p>`,
  },
  {
    id: "arbitration",
    title: "Arbitration Clause",
    category: "Dispute Resolution",
    content: `<p><strong>Arbitration:</strong> Any dispute arising under this agreement shall be resolved through binding arbitration in accordance with the rules of [arbitration body], and the award of the arbitrator(s) shall be final and binding.</p>`,
  },
  {
    id: "severability",
    title: "Severability Clause",
    category: "General",
    content: `<p><strong>Severability:</strong> If any provision of this agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</p>`,
  },
  {
    id: "entire-agreement",
    title: "Entire Agreement Clause",
    category: "General",
    content: `<p><strong>Entire Agreement:</strong> This agreement constitutes the entire understanding between the parties and supersedes all prior discussions, agreements, and understandings, whether written or oral.</p>`,
  },
  {
    id: "notice-demand",
    title: "Legal Notice - Demand",
    category: "Legal Notices",
    content: `<p><strong>LEGAL NOTICE</strong></p><p>Under instructions from and on behalf of my client, [Name], I hereby call upon you to [specific demand]. You are requested to comply with this demand within [number] days from the receipt of this notice, failing which appropriate legal proceedings shall be initiated against you at your risk as to costs and consequences.</p>`,
  },
  {
    id: "notice-breach",
    title: "Legal Notice - Breach",
    category: "Legal Notices",
    content: `<p><strong>NOTICE OF BREACH</strong></p><p>Take notice that you are in breach of [agreement/obligation] dated [date]. Despite previous reminders, you have failed to [remedy breach]. You are hereby called upon to remedy the said breach within [number] days, failing which my client shall be constrained to take appropriate legal action.</p>`,
  },
];

const LEGAL_TEMPLATES = {
  notice: `<h1>Legal Notice</h1><p><strong>From:</strong> [Sender Name and Address]</p><p><strong>To:</strong> [Recipient Name and Address]</p><p><strong>Date:</strong> [Date]</p><p><strong>Subject:</strong> [Subject]</p><p>Sir/Madam,</p><p>Under instructions from and on behalf of my client, I hereby state as follows:</p><ol><li>[Material fact 1]</li><li>[Material fact 2]</li><li>[Breach / legal grievance]</li></ol><p>You are hereby called upon to [perform required action] within [time period], failing which my client shall take appropriate legal proceedings at your risk as to costs and consequences.</p><p>Sincerely,</p><p>[Advocate Name]</p>`,
  email: `<h1>Client Update</h1><p>Dear [Client Name],</p><p>I am writing to update you regarding [matter].</p><p><strong>Key points:</strong></p><ul><li>[Point 1]</li><li>[Point 2]</li><li>[Point 3]</li></ul><p><strong>Next steps:</strong></p><ol><li>[Action 1]</li><li>[Action 2]</li></ol><p>Regards,</p><p>[Your Name]</p>`,
  petition: `<h1>Draft Petition</h1><p><strong>IN THE [COURT NAME]</strong></p><p><strong>Between:</strong></p><p>[Petitioner]</p><p>Versus</p><p>[Respondent]</p><h2>Most Respectfully Showeth</h2><ol><li>[Jurisdiction and parties]</li><li>[Relevant facts]</li><li>[Cause of action]</li><li>[Grounds]</li></ol><h2>Prayer</h2><p>In the above premises, it is most respectfully prayed that this Hon'ble Court may be pleased to:</p><ol><li>[Relief 1]</li><li>[Relief 2]</li></ol><p>And pass such further orders as this Hon'ble Court may deem fit.</p>`,
  memo: `<h1>Legal Memorandum</h1><p><strong>Issue:</strong> [Issue]</p><p><strong>Short Answer:</strong> [Short answer]</p><h2>Facts</h2><p>[Relevant facts]</p><h2>Analysis</h2><p>[Legal analysis]</p><h2>Conclusion</h2><p>[Conclusion]</p>`,
} as const;

function htmlToParagraphs(html: string) {
  return html
    .replace(/<\/(p|h1|h2|h3|li|blockquote)>/gi, "$&\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

type EditorComment = {
  id: string;
  text: string;
  quote: string;
  createdAt: string;
};

type EditorVersion = {
  id: string;
  label: string;
  html: string;
  createdAt: string;
};

type TrackedChange = {
  id: string;
  original: string;
  revised: string;
  createdAt: string;
};

interface EditorArtifactProps {
  content: string;
  isStreaming: boolean;
  storageKey?: string;
}

export function EditorArtifact({
  content,
  isStreaming,
  storageKey,
}: EditorArtifactProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const lastAppliedContentRef = useRef("");
  const [editorHtml, setEditorHtml] = useState(content.includes("<") ? content : content.replace(/\n/g, "<br />"));
  const [isDirty, setIsDirty] = useState(false);
  const [comments, setComments] = useState<EditorComment[]>([]);
  const [versions, setVersions] = useState<EditorVersion[]>([]);
  const [showComments, setShowComments] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [isRewritingSelection, setIsRewritingSelection] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof LEGAL_TEMPLATES | "">("");
  const [trackChanges, setTrackChanges] = useState(true);
  const [trackedChanges, setTrackedChanges] = useState<TrackedChange[]>([]);
  const [showClauseLibrary, setShowClauseLibrary] = useState(false);
  const [clauseCategoryFilter, setClauseCategoryFilter] = useState<string>("all");
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [fontSize, setFontSize] = useState<string>("3");
  const [textColor, setTextColor] = useState<string>("#000000");
  const [highlightColor, setHighlightColor] = useState<string>("yellow");
  const [fontFamily, setFontFamily] = useState<string>("serif");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<"text" | "highlight" | null>(null);
  const [specialCharValue, setSpecialCharValue] = useState<string>("");
  const [caseValue, setCaseValue] = useState<string>("");

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.editorHtml === "string" && parsed.editorHtml.trim()) {
        setEditorHtml(parsed.editorHtml);
        if (editorRef.current) editorRef.current.innerHTML = parsed.editorHtml;
      }
      if (Array.isArray(parsed?.comments)) setComments(parsed.comments);
      if (Array.isArray(parsed?.versions)) setVersions(parsed.versions);
      if (Array.isArray(parsed?.trackedChanges)) setTrackedChanges(parsed.trackedChanges);
    } catch {
      // ignore corrupted editor storage
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        editorHtml,
        comments,
        versions,
        trackedChanges,
      })
    );
  }, [storageKey, editorHtml, comments, versions, trackedChanges]);

  useEffect(() => {
    const element = editorRef.current;
    if (!element) return;
    if (document.activeElement === element) return;
    if (lastAppliedContentRef.current === content) return;

    const normalizedContent = content.includes("<") ? content : content.replace(/\n/g, "<br />");
    element.innerHTML = normalizedContent;
    setEditorHtml(normalizedContent);
    lastAppliedContentRef.current = content;
  }, [content]);

  const savedSelectionRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (!savedSelectionRef.current || !editorRef.current) return false;

    const selection = window.getSelection();
    if (!selection) return false;

    const editorContainsRange = editorRef.current.contains(savedSelectionRef.current.commonAncestorContainer);
    if (!editorContainsRange) return false;

    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current);
    return true;
  };

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();

    const hasSelection = restoreSelection();

    const selection = window.getSelection();
    if (!hasSelection && editorRef.current && (!selection || selection.isCollapsed)) {
      editorRef.current.focus();
    }

    const result = document.execCommand(command, false, value);
    const nextHtml = editorRef.current?.innerHTML || "";
    setEditorHtml(nextHtml);
    setIsDirty(true);
    return result;
  };

  const insertHtml = (html: string) => runCommand("insertHTML", html);

  const insertTable = () => {
    const selectionToRestore = savedSelectionRef.current;
    const rows = Number(window.prompt("Rows", "3") || "0");
    const cols = Number(window.prompt("Columns", "3") || "0");
    if (!rows || !cols || rows < 1 || cols < 1) return;

    editorRef.current?.focus();
    if (selectionToRestore) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectionToRestore);
      }
    }

    const head = `<tr>${Array.from({ length: cols }, (_, i) => `<th>Header ${i + 1}</th>`).join("")}</tr>`;
    const body = Array.from({ length: rows - 1 }, () => `<tr>${Array.from({ length: cols }, () => "<td>Cell</td>").join("")}</tr>`).join("");
    insertHtml(
      `<table style="width:100%; border-collapse:collapse; margin:12px 0;" border="1"><thead>${head}</thead><tbody>${body}</tbody></table><p></p>`
    );
  };

  const insertLink = () => {
    const selectionToRestore = savedSelectionRef.current;
    const url = window.prompt("Link URL");
    if (!url) return;

    editorRef.current?.focus();
    if (selectionToRestore) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectionToRestore);
      }
    }
    runCommand("createLink", url);
  };

  const insertClause = (clauseHtml: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    insertHtml(clauseHtml);
    setShowClauseLibrary(false);
    setIsDirty(true);
  };

  const clearFormatting = () => {
    runCommand("removeFormat");
  };

  const unlinkSelection = () => {
    runCommand("unlink");
  };

  const changeFontSize = (size: string) => {
    setFontSize(size);
    runCommand("fontSize", size);
  };

  const findAndReplace = () => {
    if (!editorRef.current || !findText) return;

    const html = editorRef.current.innerHTML;
    if (!replaceText) {
      const highlighted = html.replace(
        new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        '<mark class="bg-yellow-200">$&</mark>'
      );
      editorRef.current.innerHTML = highlighted;
    } else {
      const replaced = html.replace(
        new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        replaceText
      );
      editorRef.current.innerHTML = replaced;
    }
    setEditorHtml(editorRef.current.innerHTML);
    setIsDirty(true);
  };

  const changeTextColor = (color: string) => {
    setTextColor(color);
    runCommand("foreColor", color);
    setShowColorPicker(null);
  };

  const changeHighlightColor = (color: string) => {
    setHighlightColor(color);
    runCommand("hiliteColor", color);
    setShowColorPicker(null);
  };

  const changeFontFamily = (family: string) => {
    setFontFamily(family);
    runCommand("fontName", family);
  };

  const insertPageBreak = () => {
    insertHtml('<div style="page-break-after: always;"></div><p></p>');
  };

  const insertCurrentDate = () => {
    const date = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    insertHtml(`${date}`);
  };

  const selectAll = () => {
    editorRef.current?.focus();
    runCommand("selectAll");
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const insertSpecialChar = (char: string) => {
    insertHtml(char);
  };

  const convertCase = (caseType: "upper" | "lower" | "title") => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString();
    let converted = text;

    switch (caseType) {
      case "upper":
        converted = text.toUpperCase();
        break;
      case "lower":
        converted = text.toLowerCase();
        break;
      case "title":
        converted = text.replace(/\w\S*/g, (txt) =>
          txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
        );
        break;
    }

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(converted));
      setEditorHtml(editorRef.current?.innerHTML || "");
      setIsDirty(true);
    }
  };

  const saveVersion = (label?: string) => {
    const html = editorRef.current?.innerHTML || editorHtml || "";
    if (!html.trim()) return;

    const nextVersion: EditorVersion = {
      id: `${Date.now()}`,
      label: label || `Version ${versions.length + 1}`,
      html,
      createdAt: new Date().toISOString(),
    };
    setVersions((prev) => [nextVersion, ...prev].slice(0, 12));
    setIsDirty(false);
  };

  const restoreVersion = (version: EditorVersion) => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = version.html;
    setEditorHtml(version.html);
    setIsDirty(true);
  };

  const applyTemplate = (templateKey: keyof typeof LEGAL_TEMPLATES) => {
    const templateHtml = LEGAL_TEMPLATES[templateKey];
    if (!editorRef.current) return;
    editorRef.current.innerHTML = templateHtml;
    setEditorHtml(templateHtml);
    setIsDirty(true);
    setSelectedTemplate(templateKey);
  };

  const focusTrackedChange = (changeId: string) => {
    const element = editorRef.current?.querySelector(`[data-change-id="${changeId}"]`) as HTMLElement | null;
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("ring-2", "ring-emerald-400");
    window.setTimeout(() => {
      element.classList.remove("ring-2", "ring-emerald-400");
    }, 1500);
  };

  const resolveTrackedChange = (changeId: string, keep: "original" | "revised") => {
    const element = editorRef.current?.querySelector(`[data-change-id="${changeId}"]`) as HTMLElement | null;
    if (!element) return;

    const originalNode = element.querySelector(`[data-change-old="${changeId}"]`) as HTMLElement | null;
    const revisedNode = element.querySelector(`[data-change-new="${changeId}"]`) as HTMLElement | null;
    const replacement = keep === "original" ? originalNode?.innerText || "" : revisedNode?.innerText || "";

    element.replaceWith(document.createTextNode(replacement));
    setTrackedChanges((prev) => prev.filter((change) => change.id !== changeId));
    setEditorHtml(editorRef.current?.innerHTML || editorHtml);
    setIsDirty(true);
  };

  const addComment = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (!text) return;

    const commentText = window.prompt("Comment");
    if (!commentText?.trim()) return;

    const commentId = `comment-${Date.now()}`;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.className = "bg-amber-100 rounded px-0.5";
    span.dataset.commentId = commentId;
    span.title = commentText.trim();
    try {
      range.surroundContents(span);
    } catch {
      document.execCommand("hiliteColor", false, "#fef3c7");
    }

    setComments((prev) => [
      {
        id: commentId,
        text: commentText.trim(),
        quote: text,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setEditorHtml(editorRef.current?.innerHTML || editorHtml);
    setIsDirty(true);
    setShowComments(true);
  };

  const rewriteSelection = async () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const originalText = selection.toString().trim();
    if (!originalText) return;

    const preservedRange = selection.getRangeAt(0).cloneRange();
    setIsRewritingSelection(true);
    try {
      const response = await generateContent({
        prompt: `Rewrite the following legal drafting excerpt so it is clearer, tighter, and more professional. Preserve legal meaning and factual content. Return only the rewritten text.\n\n${originalText}`,
        temperature: 0.3,
      });

      const rewritten = response.text.trim();
      if (!rewritten) return;

      selection.removeAllRanges();
      selection.addRange(preservedRange);
      preservedRange.deleteContents();
      if (trackChanges) {
        const changeId = `change-${Date.now()}`;
        const wrapper = document.createElement("span");
        wrapper.dataset.changeId = changeId;
        wrapper.className = "inline";
        wrapper.innerHTML = `<span class="bg-rose-100 text-rose-900 line-through rounded px-0.5 mr-1" data-change-old="${changeId}">${originalText}</span><span class="bg-emerald-100 text-emerald-900 rounded px-0.5" data-change-new="${changeId}">${rewritten}</span>`;
        preservedRange.insertNode(wrapper);
        setTrackedChanges((prev) => [
          {
            id: changeId,
            original: originalText,
            revised: rewritten,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        preservedRange.insertNode(document.createTextNode(rewritten));
      }
      setEditorHtml(editorRef.current?.innerHTML || editorHtml);
      setIsDirty(true);
    } finally {
      setIsRewritingSelection(false);
    }
  };

  const removeComment = (commentId: string) => {
    const element = editorRef.current?.querySelector(`[data-comment-id="${commentId}"]`) as HTMLElement | null;
    if (element) {
      const parent = element.parentNode;
      while (element.firstChild) parent?.insertBefore(element.firstChild, element);
      parent?.removeChild(element);
    }
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    setEditorHtml(editorRef.current?.innerHTML || "");
    setIsDirty(true);
  };

  const focusCommentAnchor = (commentId: string) => {
    const element = editorRef.current?.querySelector(`[data-comment-id="${commentId}"]`) as HTMLElement | null;
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("ring-2", "ring-amber-400");
    window.setTimeout(() => {
      element.classList.remove("ring-2", "ring-amber-400");
    }, 1500);
  };

  const importDocument = async (file: File) => {
    const text = await file.text();
    const html = file.type.includes("html") || file.name.endsWith(".html")
      ? text
      : text
          .split(/\n{2,}/)
          .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
          .join("");

    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      setEditorHtml(html);
      setIsDirty(true);
    }
  };

  const exportDocument = (type: "html" | "txt") => {
    const html = editorRef.current?.innerHTML || editorHtml || "";
    const payload =
      type === "html"
        ? html
        : (editorRef.current?.innerText || "").trim();
    const blob = new Blob([payload], { type: type === "html" ? "text/html;charset=utf-8" : "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lexram-draft.${type}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportDocx = async () => {
    const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } = await import("docx");
    const text = (editorRef.current?.innerText || "").trim();
    const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

    const paragraphs = blocks.map((block, index) => {
      const textRun = new TextRun(block);

      if (index === 0) {
        return new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.LEFT,
          children: [textRun],
        });
      }
      return new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [textRun],
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lexram-draft.docx";
    link.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = (() => {
    const text = (editorHtml || (content.includes("<") ? content : content.replace(/\n/g, "<br />")))
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  })();

  const baselineHtml = versions[0]?.html || (content.includes("<") ? content : content.replace(/\n/g, "<br />"));
  const baselineParagraphs = htmlToParagraphs(baselineHtml);
  const currentParagraphs = htmlToParagraphs(editorHtml || baselineHtml);

  return (
    <div className={`flex flex-col h-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border-default)] px-3 py-2 text-[var(--text-secondary)]">
        <input
          ref={importInputRef}
          type="file"
          accept=".txt,.html,.htm"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) importDocument(file).catch(() => undefined);
            event.currentTarget.value = "";
          }}
        />
        <button onMouseDown={saveSelection} onClick={() => runCommand("formatBlock", "p")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Paragraph" title="Paragraph"><Pilcrow className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("formatBlock", "h1")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Heading 1" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("formatBlock", "h2")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Heading 2" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("formatBlock", "h3")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Heading 3" title="Heading 3"><Heading3 className="w-4 h-4" /></button>
        <span className="mx-1 h-4 w-px bg-[var(--border-default)]" />
        <button onMouseDown={saveSelection} onClick={() => runCommand("bold")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Bold" title="Bold (Ctrl+B)"><Bold className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("italic")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Italic" title="Italic (Ctrl+I)"><Italic className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("underline")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Underline" title="Underline (Ctrl+U)"><Underline className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("strikethrough")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Strikethrough" title="Strikethrough"><Strikethrough className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("superscript")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Superscript" title="Superscript"><Superscript className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("subscript")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Subscript" title="Subscript"><Subscript className="w-4 h-4" /></button>
        <div className="relative">
          <button onMouseDown={saveSelection} onClick={() => setShowColorPicker(showColorPicker === "highlight" ? null : "highlight")} className="rounded p-1.5 hover:bg-[var(--surface-hover)] relative" aria-label="Highlight color" title="Highlight Color">
            <Highlighter className="w-4 h-4 text-[var(--text-secondary)]" />
            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white" style={{ backgroundColor: highlightColor }} />
          </button>
          {showColorPicker === "highlight" && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg z-50 grid grid-cols-5 gap-1">
              {["yellow", "#ff9999", "#99ff99", "#9999ff", "#ffff99", "#ff99ff", "#99ffff", "#ffcc99", "#cc99ff", "white"].map((c) => (
                <button key={c} onClick={() => changeHighlightColor(c)} className="w-6 h-6 rounded border border-[var(--border-default)]" style={{ backgroundColor: c }} />
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onMouseDown={saveSelection} onClick={() => setShowColorPicker(showColorPicker === "text" ? null : "text")} className="rounded p-1.5 hover:bg-[var(--surface-hover)] relative" aria-label="Text color" title="Text Color">
            <Palette className="w-4 h-4 text-[var(--text-secondary)]" />
            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white" style={{ backgroundColor: textColor }} />
          </button>
          {showColorPicker === "text" && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg z-50 grid grid-cols-5 gap-1">
              {["#000000", "#333333", "#666666", "#999999", "#cccccc", "#ff0000", "#00aa00", "#0000ff", "#ff9900", "#9900ff"].map((c) => (
                <button key={c} onClick={() => changeTextColor(c)} className="w-6 h-6 rounded border border-[var(--border-default)]" style={{ backgroundColor: c }} />
              ))}
            </div>
          )}
        </div>
        <select
          value={fontFamily}
          onMouseDown={saveSelection}
          onChange={(e) => changeFontFamily(e.target.value)}
          className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-1.5 py-1 text-xs text-[var(--text-secondary)]"
          aria-label="Font family"
        >
          <option value="serif">Serif</option>
          <option value="sans-serif">Sans</option>
          <option value="monospace">Mono</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times</option>
          <option value="Courier New">Courier</option>
        </select>
        <button onMouseDown={saveSelection} onClick={() => insertHtml("<blockquote>Quoted text</blockquote><p></p>")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Block quote" title="Blockquote"><Quote className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => insertHtml("<code>code</code>")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Code" title="Inline Code"><Text className="w-4 h-4" /></button>
        <span className="mx-1 h-4 w-px bg-[var(--border-default)]" />
        <button onMouseDown={saveSelection} onClick={insertLink} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Insert link" title="Insert Link"><Link2 className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={unlinkSelection} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Remove link" title="Remove Link"><Link2Off className="w-4 h-4" /></button>
        <span className="mx-1 h-4 w-px bg-[var(--border-default)]" />
        <button onMouseDown={saveSelection} onClick={() => runCommand("justifyLeft")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Align left" title="Align Left"><AlignLeft className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("justifyCenter")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Align center" title="Align Center"><AlignCenter className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("justifyRight")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Align right" title="Align Right"><AlignRight className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("justifyFull")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Justify" title="Justify"><AlignJustify className="w-4 h-4" /></button>
        <span className="mx-1 h-4 w-px bg-[var(--border-default)]" />
        <button onMouseDown={saveSelection} onClick={() => runCommand("insertUnorderedList")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Bulleted list" title="Bulleted List"><List className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("insertOrderedList")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Numbered list" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={insertTable} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Insert table" title="Insert Table"><Table2 className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => insertHtml("<hr /><p></p>")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Insert divider" title="Horizontal Line"><Minus className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={insertPageBreak} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Page break" title="Page Break"><FileX2 className="w-4 h-4" /></button>
        <select
          value={specialCharValue}
          onMouseDown={saveSelection}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              insertSpecialChar(val);
              setSpecialCharValue("");
            }
          }}
          className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-1.5 py-1 text-xs text-[var(--text-secondary)]"
          aria-label="Insert special character"
        >
          <option value="">Special Chars</option>
          <option value="§">§ Section</option>
          <option value="¶">¶ Paragraph</option>
          <option value="©">© Copyright</option>
          <option value="®">® Registered</option>
          <option value="™">™ Trademark</option>
          <option value="—">— Em Dash</option>
          <option value="–">– En Dash</option>
          <option value="&quot;">&quot; Quote</option>
          <option value="'">&apos; Apostrophe</option>
          <option value="°">° Degree</option>
          <option value="±">± Plus-Minus</option>
          <option value="×">× Multiply</option>
          <option value="÷">÷ Divide</option>
          <option value="→">→ Arrow</option>
          <option value="•">• Bullet</option>
        </select>
        <span className="mx-1 h-4 w-px bg-[var(--border-default)]" />
        <button onMouseDown={saveSelection} onClick={() => runCommand("indent")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Increase indent" title="Increase Indent"><IndentIncrease className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("outdent")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Decrease indent" title="Decrease Indent"><IndentDecrease className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={clearFormatting} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Clear formatting" title="Clear Formatting"><RemoveFormatting className="w-4 h-4" /></button>
        <select
          value={fontSize}
          onMouseDown={saveSelection}
          onChange={(e) => changeFontSize(e.target.value)}
          className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-1.5 py-1 text-xs text-[var(--text-secondary)]"
          aria-label="Font size"
        >
          <option value="1">Small</option>
          <option value="2">Normal</option>
          <option value="3">Medium</option>
          <option value="4">Large</option>
          <option value="5">X-Large</option>
          <option value="6">XX-Large</option>
          <option value="7">Huge</option>
        </select>
        <span className="mx-1 h-4 w-px bg-[var(--border-default)]" />
        <button onMouseDown={saveSelection} onClick={() => runCommand("undo")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Undo" title="Undo (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => runCommand("redo")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Redo" title="Redo (Ctrl+Y)"><Redo2 className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={selectAll} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Select all" title="Select All"><ScanLine className="w-4 h-4" /></button>
        <span className="mx-1 h-4 w-px bg-[var(--border-default)]" />
        <button onClick={() => importInputRef.current?.click()} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Import text or HTML" title="Import Document"><FileInput className="w-4 h-4" /></button>
        <button onClick={() => exportDocument("html")} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Export HTML" title="Export as HTML"><Download className="w-4 h-4" /></button>
        <button onClick={() => exportDocument("txt")} className="rounded p-1.5 hover:bg-[var(--surface-hover)] text-xs px-2" aria-label="Export plain text" title="Export as TXT">TXT</button>
        <button onClick={() => exportDocx().catch(() => undefined)} className="rounded px-2 py-1.5 hover:bg-[var(--surface-hover)] text-xs font-medium" aria-label="Export DOCX" title="Export as DOCX">DOCX</button>
        <button onClick={() => window.print()} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Print" title="Print"><Printer className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={insertCurrentDate} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Insert date" title="Insert Current Date"><Calendar className="w-4 h-4" /></button>
        <button onClick={toggleFullscreen} className={`rounded p-1.5 ${isFullscreen ? "bg-[var(--bg-sidebar)] text-white" : "hover:bg-[var(--surface-hover)]"}`} aria-label="Fullscreen" title="Toggle Fullscreen"><Maximize2 className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={addComment} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Add comment" title="Add Comment"><MessageSquareQuote className="w-4 h-4" /></button>
        <button onClick={() => saveVersion()} className="rounded p-1.5 hover:bg-[var(--surface-hover)]" aria-label="Save version" title="Save Version"><Save className="w-4 h-4" /></button>
        <button onClick={() => setReviewMode((prev) => !prev)} className={`rounded p-1.5 ${reviewMode ? "bg-[var(--bg-sidebar)] text-white" : "hover:bg-[var(--surface-hover)]"}`} aria-label="Toggle review mode" title="Review Mode"><Columns2 className="w-4 h-4" /></button>
        <button onMouseDown={saveSelection} onClick={() => rewriteSelection().catch(() => undefined)} className={`rounded p-1.5 ${isRewritingSelection ? "bg-[var(--border-default)] text-[var(--text-muted)]" : "hover:bg-[var(--surface-hover)]"}`} aria-label="Rewrite selected text" title="AI Rewrite Selection">
          <Sparkles className="w-4 h-4" />
        </button>
        <button onClick={() => setTrackChanges((prev) => !prev)} className={`rounded-md border px-2 py-1 text-xs ${trackChanges ? "border-[var(--bg-sidebar)] bg-[var(--bg-sidebar)] text-white" : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"}`} aria-label="Toggle track changes">
          Track changes
        </button>
        <select
          value={caseValue}
          onMouseDown={saveSelection}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              convertCase(val as "upper" | "lower" | "title");
              setCaseValue("");
            }
          }}
          className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-1.5 py-1 text-xs text-[var(--text-secondary)]"
          aria-label="Change case"
        >
          <option value="">Case</option>
          <option value="upper">UPPERCASE</option>
          <option value="lower">lowercase</option>
          <option value="title">Title Case</option>
        </select>
        <button onClick={() => setShowClauseLibrary((prev) => !prev)} className={`rounded-md border px-2 py-1 text-xs flex items-center gap-1 ${showClauseLibrary ? "border-[var(--bg-sidebar)] bg-[var(--bg-sidebar)] text-white" : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"}`} aria-label="Toggle clause library">
          <BookMarked className="w-3 h-3" /> Clauses
        </button>
        <button onClick={() => setShowFindReplace((prev) => !prev)} className={`rounded-md border px-2 py-1 text-xs flex items-center gap-1 ${showFindReplace ? "border-[var(--bg-sidebar)] bg-[var(--bg-sidebar)] text-white" : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"}`} aria-label="Find and replace">
          <Search className="w-3 h-3" /> Find & Replace
        </button>
        <select
          value={selectedTemplate}
          onMouseDown={saveSelection}
          onChange={(event) => {
            const value = event.target.value as keyof typeof LEGAL_TEMPLATES | "";
            setSelectedTemplate(value);
            if (value) applyTemplate(value);
          }}
          className="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-secondary)]"
          aria-label="Apply legal template"
        >
          <option value="">Templates</option>
          <option value="notice">Legal notice</option>
          <option value="email">Client email</option>
          <option value="petition">Petition</option>
          <option value="memo">Memo</option>
        </select>
        <div className="ml-auto text-xs text-[var(--text-muted)]">
          {isRewritingSelection ? "Rewriting selection..." : isStreaming ? "Drafting live..." : isDirty ? "Edited" : "Editable document"} · {wordCount} words
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-default)] bg-[var(--surface-hover)] px-3 py-2 text-xs text-[var(--text-secondary)]">
        <button onClick={() => setShowComments((prev) => !prev)} className={`rounded-full border px-3 py-1 ${showComments ? "border-[var(--bg-sidebar)] bg-[var(--bg-sidebar)] text-white" : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--surface-hover)]"}`}>
          Comments ({comments.length})
        </button>
        <button onClick={() => setShowVersions((prev) => !prev)} className={`rounded-full border px-3 py-1 ${showVersions ? "border-[var(--bg-sidebar)] bg-[var(--bg-sidebar)] text-white" : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--surface-hover)]"}`}>
          Versions ({versions.length})
        </button>
        <button onClick={() => setShowClauseLibrary((prev) => !prev)} className={`rounded-full border px-3 py-1 ${showClauseLibrary ? "border-[var(--bg-sidebar)] bg-[var(--bg-sidebar)] text-white" : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--surface-hover)]"}`}>
          Clause Library
        </button>
        <button onClick={() => setShowFindReplace((prev) => !prev)} className={`rounded-full border px-3 py-1 ${showFindReplace ? "border-[var(--bg-sidebar)] bg-[var(--bg-sidebar)] text-white" : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--surface-hover)]"}`}>
          Find & Replace
        </button>
        <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1">Changes ({trackedChanges.length})</span>
      </div>
      {(showComments || showVersions || showClauseLibrary || showFindReplace) && (
        <div className="grid gap-3 border-b border-[var(--border-default)] bg-[var(--surface-hover)] px-3 py-3">
          {showComments && (
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
              <div className="text-xs font-semibold text-[var(--text-primary)]">Comments</div>
              {comments.length === 0 ? (
                <div className="mt-2 text-xs text-[var(--text-muted)]">Select text in the document and use the comment tool to add review notes.</div>
              ) : (
                <div className="mt-2 space-y-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-md border border-[var(--border-default)] p-2">
                      <div className="text-[11px] font-medium text-[var(--text-muted)]">{new Date(comment.createdAt).toLocaleString()}</div>
                      <div className="mt-1 text-xs text-[var(--text-primary)]">{comment.text}</div>
                      <div className="mt-1 text-[11px] text-[var(--text-muted)] line-clamp-2">&quot;{comment.quote}&quot;</div>
                      <div className="mt-2 flex items-center gap-3">
                        <button onClick={() => focusCommentAnchor(comment.id)} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Go to clause</button>
                        <button onClick={() => removeComment(comment.id)} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {showVersions && (
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
              <div className="text-xs font-semibold text-[var(--text-primary)]">Version history</div>
              {versions.length === 0 ? (
                <div className="mt-2 text-xs text-[var(--text-muted)]">Use save version to snapshot the current draft.</div>
              ) : (
                <div className="mt-2 space-y-2">
                  {versions.map((version) => (
                    <div key={version.id} className="flex items-center justify-between gap-2 rounded-md border border-[var(--border-default)] p-2">
                      <div>
                        <div className="text-xs font-medium text-[var(--text-primary)]">{version.label}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{new Date(version.createdAt).toLocaleString()}</div>
                      </div>
                      <button onClick={() => restoreVersion(version)} className="rounded-md border border-[var(--border-default)] px-2 py-1 text-[11px] hover:bg-[var(--surface-hover)]">Restore</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {showClauseLibrary && (
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-[var(--text-primary)]">Clause Library</div>
                <button onClick={() => setShowClauseLibrary(false)} className="p-1 rounded hover:bg-[var(--surface-hover)]" aria-label="Close clause library">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="mb-3 flex flex-wrap gap-1">
                <button
                  onClick={() => setClauseCategoryFilter("all")}
                  className={`rounded-full px-2 py-0.5 text-[10px] ${clauseCategoryFilter === "all" ? "bg-[var(--bg-sidebar)] text-white" : "bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"}`}
                >
                  All ({CLAUSE_LIBRARY.length})
                </button>
                {Array.from(new Set(CLAUSE_LIBRARY.map(c => c.category))).map(category => (
                  <button
                    key={category}
                    onClick={() => setClauseCategoryFilter(category)}
                    className={`rounded-full px-2 py-0.5 text-[10px] ${clauseCategoryFilter === category ? "bg-[var(--bg-sidebar)] text-white" : "bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"}`}
                  >
                    {category} ({CLAUSE_LIBRARY.filter(c => c.category === category).length})
                  </button>
                ))}
              </div>
              <div className="mt-2 space-y-2 max-h-[320px] overflow-y-auto">
                {CLAUSE_LIBRARY
                  .filter(clause => clauseCategoryFilter === "all" || clause.category === clauseCategoryFilter)
                  .map((clause) => (
                    <div key={clause.id} className="rounded-md border border-[var(--border-default)] p-2 hover:border-[var(--border-default)] transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--text-primary)]">{clause.title}</span>
                            <span className="rounded-full bg-[var(--surface-hover)] px-1.5 py-0.5 text-[9px] text-[var(--text-muted)]">{clause.category}</span>
                          </div>
                          <div className="mt-1 text-[10px] text-[var(--text-muted)] line-clamp-2" dangerouslySetInnerHTML={{ __html: clause.content.replace(/<[^>]+>/g, " ").substring(0, 80) + "..." }} />
                        </div>
                        <button
                          onMouseDown={saveSelection}
                          onClick={() => insertClause(clause.content)}
                          className="flex-shrink-0 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] hover:bg-[var(--surface-hover)] whitespace-nowrap"
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {showFindReplace && (
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-[var(--text-primary)]">Find & Replace</div>
                <button onClick={() => setShowFindReplace(false)} className="p-1 rounded hover:bg-[var(--surface-hover)]" aria-label="Close find and replace">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder="Find..."
                  className="w-full rounded border border-[var(--border-default)] px-2 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Replace with..."
                  className="w-full rounded border border-[var(--border-default)] px-2 py-1.5 text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { saveSelection(); findAndReplace(); }}
                    className="flex-1 rounded bg-[var(--bg-sidebar)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--bg-sidebar)]"
                  >
                    {replaceText ? "Replace All" : "Find All"}
                  </button>
                  <button
                    onClick={() => { setFindText(""); setReplaceText(""); }}
                    className="rounded border border-[var(--border-default)] px-3 py-1.5 text-xs hover:bg-[var(--surface-hover)]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
          {trackedChanges.length > 0 && (
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
              <div className="text-xs font-semibold text-[var(--text-primary)]">Tracked changes</div>
              <div className="mt-2 space-y-2">
                {trackedChanges.map((change) => (
                  <div key={change.id} className="rounded-md border border-[var(--border-default)] p-2">
                    <div className="text-[11px] text-[var(--text-muted)]">{new Date(change.createdAt).toLocaleString()}</div>
                    <div className="mt-1 text-[11px] text-rose-700 line-through">{change.original}</div>
                    <div className="mt-1 text-[11px] text-emerald-700">{change.revised}</div>
                    <div className="mt-2 flex items-center gap-3">
                      <button onClick={() => focusTrackedChange(change.id)} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Go to change</button>
                      <button onClick={() => resolveTrackedChange(change.id, "revised")} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Accept</button>
                      <button onClick={() => resolveTrackedChange(change.id, "original")} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div className={`flex-1 overflow-y-auto ${reviewMode ? "grid gap-4 lg:grid-cols-2" : ""}`}>
        {reviewMode && (
          <div className="min-h-[520px] border-b lg:border-b-0 lg:border-r border-[var(--border-default)] bg-[var(--surface-hover)] px-5 py-4">
            <div className="mb-3 text-xs font-semibold text-[var(--text-muted)]">Baseline</div>
            <div className="space-y-2">
              {baselineParagraphs.map((paragraph, index) => {
                const current = currentParagraphs[index];
                const changed = current !== paragraph;
                return (
                  <div key={`baseline-${index}`} className={`rounded-md px-2 py-1.5 text-sm leading-7 ${changed ? "bg-rose-50 text-rose-900" : "text-[var(--text-secondary)]"}`}>
                    {paragraph}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="min-h-[520px] px-5 py-4">
          {reviewMode && <div className="mb-3 text-xs font-semibold text-[var(--text-muted)]">Current draft</div>}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => {
              setEditorHtml(event.currentTarget.innerHTML);
              setIsDirty(true);
            }}
            className="min-h-[480px] whitespace-pre-wrap text-base leading-8 text-[var(--text-primary)] outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--border-default)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:bg-[var(--surface-hover)] [&_blockquote]:py-3 [&_blockquote]:rounded-r-lg [&_blockquote]:my-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-[var(--text-primary)] [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-[var(--text-primary)] [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-3 [&_h3]:text-[var(--text-primary)] [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-2 [&_p]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_td]:border [&_td]:border-[var(--border-default)] [&_td]:px-3 [&_td]:py-2 [&_td]:text-base [&_th]:border [&_th]:border-[var(--border-default)] [&_th]:bg-[var(--surface-hover)] [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-sm [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_strong]:font-bold"
          />
          {reviewMode && (
            <div className="mt-4 space-y-2 border-t border-[var(--border-default)] pt-3">
              <div className="text-xs font-semibold text-[var(--text-muted)]">Detected changes</div>
              {currentParagraphs.map((paragraph, index) => {
                const baseline = baselineParagraphs[index];
                if (paragraph === baseline) return null;
                return (
                  <div key={`current-${index}`} className="rounded-md bg-emerald-50 px-2 py-1.5 text-sm leading-7 text-emerald-900">
                    {paragraph}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
