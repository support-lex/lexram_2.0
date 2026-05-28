"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link as LinkIcon,
  ImageIcon,
  Undo2,
  Redo2,
} from "lucide-react";
import { uploadBlogImage } from "@/lib/blog/api";
import { toast } from "sonner";

interface BlogEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function BlogEditor({ value, onChange, placeholder = "Start writing your story..." }: BlogEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "blog-code-block" } },
        blockquote: { HTMLAttributes: { class: "blog-quote" } },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: "blog-link" } }),
      Image.configure({ HTMLAttributes: { class: "blog-inline-image" } }),
      Placeholder.configure({ placeholder, emptyEditorClass: "is-editor-empty" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "blog-editor-content",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep the editor synced if `value` is replaced from the outside (e.g. loading a draft).
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return <div className="h-64 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]" />;

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="px-6 py-6 min-h-[420px] focus-within:outline-none" />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const setLink = useCallback(() => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertImage = useCallback(async (file: File) => {
    if (!file) return;
    const id = toast.loading("Uploading image...");
    try {
      const url = await uploadBlogImage(file, "inline");
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      toast.success("Image inserted", { id });
    } catch (e) {
      console.error(e);
      toast.error("Image upload failed", { id, description: (e as Error).message });
    }
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/40 sticky top-0 z-10 backdrop-blur">
      <ToolGroup>
        <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="Bold (⌘B)">
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="Italic (⌘I)">
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} label="Underline (⌘U)">
          <UnderlineIcon className="h-4 w-4" />
        </ToolButton>
      </ToolGroup>

      <Divider />

      <ToolGroup>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} label="Heading 1">
          <Heading1 className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} label="Heading 2">
          <Heading2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} label="Heading 3">
          <Heading3 className="h-4 w-4" />
        </ToolButton>
      </ToolGroup>

      <Divider />

      <ToolGroup>
        <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="Bullet list">
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} label="Quote">
          <Quote className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} label="Code block">
          <Code2 className="h-4 w-4" />
        </ToolButton>
      </ToolGroup>

      <Divider />

      <ToolGroup>
        <ToolButton onClick={setLink} active={editor.isActive("link")} label="Insert link">
          <LinkIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => fileInputRef.current?.click()} label="Insert image">
          <ImageIcon className="h-4 w-4" />
        </ToolButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) insertImage(file);
            e.target.value = "";
          }}
        />
      </ToolGroup>

      <Divider />

      <ToolGroup>
        <ToolButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} label="Undo">
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} label="Redo">
          <Redo2 className="h-4 w-4" />
        </ToolButton>
      </ToolGroup>
    </div>
  );
}

function ToolGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="w-px h-5 bg-[var(--border-default)] mx-1" aria-hidden />;
}

function ToolButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`grid h-8 w-8 place-items-center rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed
        ${active ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"}
      `}
    >
      {children}
    </button>
  );
}
