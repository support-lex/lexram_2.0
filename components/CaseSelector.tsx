'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronDownIcon,
  PencilIcon,
  Trash2Icon,
  PlusIcon,
  CheckIcon,
  Loader2Icon,
  BriefcaseIcon,
  ScaleIcon,
  SparklesIcon,
  FileTextIcon,
  LinkIcon,
  HashIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import api from '@/services/legal-api'

export interface Case {
  id: string
  title: string
  external_id?: string | null
  external_source?: string | null
  document_count?: number
}

interface CaseFormState {
  title: string
  external_id: string
  external_source: string
}

interface CaseSelectorProps {
  sessionId: string
  value?: string | null
  onChange?: (caseId: string | null, c: Case | null) => void
  className?: string
}

const emptyForm: CaseFormState = { title: '', external_id: '', external_source: '' }

const SOURCE_PRESETS: { label: string; value: string; hint: string }[] = [
  { label: 'CNR', value: 'CNR', hint: 'India eCourts' },
  { label: 'Manual', value: 'manual', hint: 'No external link' },
]

function extractError(err: unknown): string {
  const e = err as { message?: string; response?: { data?: { detail?: unknown } } }
  const detail = e?.response?.data?.detail
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) => `${(d.loc ?? []).slice(1).join('.')}: ${d.msg ?? ''}`)
      .join('; ')
  }
  if (typeof detail === 'string') return detail
  return e?.message ?? 'Request failed'
}

export default function CaseSelector({
  sessionId,
  value,
  onChange,
  className,
}: CaseSelectorProps) {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(value ?? null)
  const [open, setOpen] = useState(false)
  const [pendingSelect, setPendingSelect] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<CaseFormState>(emptyForm)
  const [addSubmitting, setAddSubmitting] = useState(false)

  const [editCase, setEditCase] = useState<Case | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const [deleteCase, setDeleteCase] = useState<Case | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  useEffect(() => {
    setSelectedId(value ?? null)
  }, [value])

  const fetchCases = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<{ cases: Case[] } | Case[]>('/cases')
      const list = Array.isArray(res.data) ? res.data : res.data?.cases ?? []
      setCases(list)
    } catch (err) {
      toast.error(`Failed to load cases: ${extractError(err)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const selected = useMemo(
    () => cases.find((c) => c.id === selectedId) ?? null,
    [cases, selectedId],
  )

  const handleSelect = async (c: Case) => {
    if (c.id === selectedId) {
      setOpen(false)
      return
    }
    const prev = selectedId
    setSelectedId(c.id)
    setPendingSelect(c.id)
    onChange?.(c.id, c)
    try {
      await api.patch(`/sessions/${sessionId}/case`, { case_id: c.id })
      toast.success(`Switched to "${c.title}"`)
      setOpen(false)
    } catch (err) {
      setSelectedId(prev)
      onChange?.(prev, cases.find((x) => x.id === prev) ?? null)
      toast.error(`Could not select case: ${extractError(err)}`)
    } finally {
      setPendingSelect(null)
    }
  }

  const openAdd = () => {
    setAddForm(emptyForm)
    setAddOpen(true)
    setOpen(false)
  }

  const submitAdd = async () => {
    if (!addForm.title.trim()) {
      toast.error('Title is required')
      return
    }
    setAddSubmitting(true)
    try {
      const payload = {
        title: addForm.title.trim(),
        external_id: addForm.external_id.trim() || null,
        external_source: addForm.external_source.trim() || null,
      }
      const res = await api.post<Case>('/cases', payload)
      const created = res.data
      setCases((prev) => [created, ...prev])
      setAddOpen(false)
      toast.success('Case created', { description: `"${created.title}" is now active` })
      await handleSelect(created)
    } catch (err) {
      toast.error(`Create failed: ${extractError(err)}`)
    } finally {
      setAddSubmitting(false)
    }
  }

  const openEdit = (c: Case) => {
    setEditCase(c)
    setEditTitle(c.title ?? '')
    setOpen(false)
  }

  const submitEdit = async () => {
    if (!editCase) return
    const newTitle = editTitle.trim()
    if (!newTitle) {
      toast.error('Title is required')
      return
    }
    const target = editCase
    const snapshot = cases
    setCases((prev) => prev.map((c) => (c.id === target.id ? { ...c, title: newTitle } : c)))
    setEditSubmitting(true)
    try {
      const res = await api.patch<Case>(`/cases/${target.id}`, { title: newTitle })
      setCases((prev) => prev.map((c) => (c.id === target.id ? { ...c, ...res.data } : c)))
      setEditCase(null)
      toast.success('Case renamed')
    } catch (err) {
      setCases(snapshot)
      toast.error(`Update failed: ${extractError(err)}`)
    } finally {
      setEditSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteCase) return
    const target = deleteCase
    const snapshot = cases
    const wasSelected = selectedId === target.id
    setCases((prev) => prev.filter((c) => c.id !== target.id))
    if (wasSelected) {
      setSelectedId(null)
      onChange?.(null, null)
    }
    setDeleteSubmitting(true)
    try {
      await api.delete(`/cases/${target.id}`)
      toast.success('Case archived')
      setDeleteCase(null)
    } catch (err) {
      setCases(snapshot)
      if (wasSelected) setSelectedId(target.id)
      toast.error(`Delete failed: ${extractError(err)}`)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const selectedCount = selected?.document_count ?? 0

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-expanded={open}
          className={cn(
            'group flex w-full items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] shadow-sm transition-all',
            'hover:border-[var(--accent)]/40 hover:shadow-md hover:bg-[var(--surface-hover)]',
            open && 'border-[var(--accent)]/60 shadow-md ring-2 ring-[var(--accent)]/10',
          )}
        >
          <BriefcaseIcon className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
          <span className="truncate max-w-[160px] text-left oracle-serif italic text-[13px]">
            {selected ? selected.title : 'Select case'}
          </span>
          {selected && (
            <span className="ml-0.5 inline-flex items-center gap-0.5 rounded-full bg-[var(--accent)]/10 px-1.5 py-0 text-[10px] font-semibold text-[var(--accent)]">
              <FileTextIcon className="w-2.5 h-2.5" />
              {selectedCount}
            </span>
          )}
          <ChevronDownIcon
            className={cn(
              'w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ml-auto',
              open && 'rotate-180',
            )}
          />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-[320px] p-0 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] ring-1 ring-black/[0.02]"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-b from-[var(--surface-hover)]/50 to-transparent border-b border-[var(--border-light)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ScaleIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Your Cases
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">
                {cases.length} total
              </span>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[280px] overflow-y-auto custom-scrollbar py-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-[var(--text-muted)]">
                <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                Loading cases…
              </div>
            ) : cases.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <BriefcaseIcon className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-30 mb-2" />
                <p className="text-xs text-[var(--text-muted)]">No cases yet</p>
                <p className="text-[10px] text-[var(--text-muted)]/70 mt-0.5">
                  Create your first one below
                </p>
              </div>
            ) : (
              cases.map((c) => {
                const isSelected = c.id === selectedId
                const isPending = pendingSelect === c.id
                const isSystem = c.title === 'Unassigned'
                const count = c.document_count ?? 0
                return (
                  <div
                    key={c.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(c)}
                    className={cn(
                      'group relative mx-1 my-0.5 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all',
                      isSelected
                        ? 'bg-gradient-to-r from-[var(--accent)]/10 to-transparent ring-1 ring-[var(--accent)]/20'
                        : 'hover:bg-[var(--surface-hover)]',
                    )}
                  >
                    {/* Selected indicator bar */}
                    {isSelected && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-[var(--accent)]" />
                    )}

                    {/* Icon */}
                    <div
                      className={cn(
                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-colors',
                        isSelected
                          ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                          : 'bg-[var(--surface-hover)] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]',
                      )}
                    >
                      {isSystem ? (
                        <FileTextIcon className="w-3.5 h-3.5" />
                      ) : (
                        <BriefcaseIcon className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Title + meta */}
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          'truncate text-[13px] font-medium',
                          isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]',
                        )}
                      >
                        {c.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-0.5">
                          <FileTextIcon className="w-2.5 h-2.5" />
                          {count} {count === 1 ? 'document' : 'documents'}
                        </span>
                        {c.external_source && (
                          <>
                            <span className="opacity-40">·</span>
                            <span className="inline-flex items-center gap-0.5 uppercase tracking-wider">
                              <LinkIcon className="w-2.5 h-2.5" />
                              {c.external_source}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right cluster */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isPending && (
                        <Loader2Icon className="w-3 h-3 animate-spin text-[var(--accent)]" />
                      )}
                      {isSelected && !isPending && (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-text)]">
                          <CheckIcon className="w-2.5 h-2.5" strokeWidth={3} />
                        </div>
                      )}
                      {!isSystem && (
                        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            aria-label="Edit case"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(c)
                            }}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete case"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteCase(c)
                              setOpen(false)
                            }}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2Icon className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer CTA */}
          <div className="border-t border-[var(--border-light)] p-1.5 bg-gradient-to-b from-transparent to-[var(--surface-hover)]/40">
            <button
              type="button"
              onClick={openAdd}
              className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-all hover:bg-[var(--accent)]/10"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)] text-[var(--accent-text)] shadow-sm transition-transform group-hover:scale-105">
                <PlusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Add new case
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Start a fresh research thread
                </div>
              </div>
              <SparklesIcon className="w-3 h-3 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* ── Super Add-Case Modal ────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={(v) => !addSubmitting && setAddOpen(v)}>
        <DialogContent className="p-0 max-w-lg overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
          {/* Hero header */}
          <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent border-b border-[var(--border-light)]">
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                 style={{ backgroundImage: 'radial-gradient(circle at 20% 10%, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <button
              type="button"
              onClick={() => !addSubmitting && setAddOpen(false)}
              className="absolute right-3 top-3 p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-text)] shadow-md">
                <ScaleIcon className="w-5 h-5" />
              </div>
              <div>
                <DialogHeader className="space-y-0">
                  <DialogTitle className="oracle-serif italic text-2xl text-[var(--text-primary)] leading-tight">
                    New case file
                  </DialogTitle>
                  <DialogDescription className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                    Organize research, documents, and sessions under one matter.
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="case-title" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <BriefcaseIcon className="w-3 h-3" />
                Case title
                <span className="text-red-500 normal-case font-normal">required</span>
              </label>
              <input
                id="case-title"
                autoFocus
                value={addForm.title}
                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
                placeholder="e.g. Acme Corp v. Widget Industries"
                disabled={addSubmitting}
                className={cn(
                  'w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/60 transition-all',
                  'disabled:opacity-60',
                )}
              />
            </div>

            {/* External source pills */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <LinkIcon className="w-3 h-3" />
                Link to external source
                <span className="text-[var(--text-muted)] normal-case font-normal">optional</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SOURCE_PRESETS.map((p) => {
                  const active = addForm.external_source === p.value
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() =>
                        setAddForm({
                          ...addForm,
                          external_source: active ? '' : p.value,
                          external_id: active ? '' : addForm.external_id,
                        })
                      }
                      disabled={addSubmitting}
                      className={cn(
                        'group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm'
                          : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)]',
                      )}
                    >
                      {active && <CheckIcon className="w-3 h-3" strokeWidth={3} />}
                      {p.label}
                      <span className="text-[10px] opacity-60 font-normal">{p.hint}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* External ID — only when a source is picked */}
            <div
              className={cn(
                'space-y-1.5 transition-all duration-200',
                addForm.external_source
                  ? 'opacity-100 max-h-24'
                  : 'opacity-0 max-h-0 overflow-hidden -mt-2',
              )}
            >
              <label htmlFor="case-ext-id" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <HashIcon className="w-3 h-3" />
                {addForm.external_source === 'CNR' ? 'CNR number' : 'Reference ID'}
              </label>
              <input
                id="case-ext-id"
                value={addForm.external_id}
                onChange={(e) => setAddForm({ ...addForm, external_id: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
                placeholder={
                  addForm.external_source === 'CNR'
                    ? 'DLCT010012342024'
                    : 'External reference'
                }
                disabled={addSubmitting}
                className={cn(
                  'w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/60 transition-all',
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 bg-gradient-to-b from-transparent to-[var(--surface-hover)]/30 border-t border-[var(--border-light)] sm:justify-between gap-2">
            <p className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <SparklesIcon className="w-3 h-3 text-[var(--accent)]" />
              Created cases sync to this session automatically.
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                disabled={addSubmitting}
                className="px-4 py-2 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAdd}
                disabled={addSubmitting || !addForm.title.trim()}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold shadow-md transition-all',
                  'bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] hover:shadow-lg hover:-translate-y-[1px]',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
                )}
              >
                {addSubmitting ? (
                  <>
                    <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Create case
                  </>
                )}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rename Modal ────────────────────────────────────────────────── */}
      <Dialog
        open={!!editCase}
        onOpenChange={(v) => !editSubmitting && !v && setEditCase(null)}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="px-5 pt-5 pb-4 border-b border-[var(--border-light)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                <PencilIcon className="w-4 h-4" />
              </div>
              <div>
                <DialogHeader className="space-y-0">
                  <DialogTitle className="oracle-serif italic text-lg">Rename case</DialogTitle>
                  <DialogDescription className="text-xs">
                    Update the display title for this matter.
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <label htmlFor="edit-case-title" className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              Title
            </label>
            <input
              id="edit-case-title"
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
              disabled={editSubmitting}
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/60 transition-all"
            />
            {editCase?.external_id && (
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] bg-[var(--surface-hover)]/50 rounded-lg px-3 py-2">
                <LinkIcon className="w-3 h-3" />
                <span className="uppercase tracking-wider font-semibold">{editCase.external_source ?? 'external'}</span>
                <span className="opacity-40">·</span>
                <span className="font-mono">{editCase.external_id}</span>
              </div>
            )}
          </div>
          <DialogFooter className="px-5 py-3 bg-[var(--surface-hover)]/30 border-t border-[var(--border-light)] gap-2">
            <button
              type="button"
              onClick={() => setEditCase(null)}
              disabled={editSubmitting}
              className="px-4 py-2 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitEdit}
              disabled={editSubmitting || !editTitle.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] shadow-sm transition-all disabled:opacity-50"
            >
              {editSubmitting && <Loader2Icon className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteCase}
        title="Archive case?"
        message={
          deleteCase
            ? `"${deleteCase.title}" will be archived. Its sessions and documents will move to your Unassigned case.`
            : ''
        }
        confirmLabel={deleteSubmitting ? 'Archiving…' : 'Archive'}
        onConfirm={confirmDelete}
        onCancel={() => !deleteSubmitting && setDeleteCase(null)}
      />
    </div>
  )
}
