'use client'

import { useEffect, useState } from 'react'
import { Loader2, Mail, User, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export interface ProfileCompletionModalProps {
  open: boolean
  /** Called when the user successfully saves their details. */
  onSaved: () => void
  /** Called when the user dismisses (Skip for now). */
  onDismiss: () => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ProfileCompletionModal({
  open,
  onSaved,
  onDismiss,
}: ProfileCompletionModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Prefill any fields the user already has from earlier signup/profile-edit
  // flows so they don't retype values that are already saved.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    supabase().auth.getUser().then(({ data }) => {
      if (cancelled) return
      const m = (data.user?.user_metadata ?? {}) as Record<string, string>
      setFirstName(m.first_name ?? '')
      setLastName(m.last_name ?? '')
      setEmail(data.user?.email ?? m.email ?? '')
    })
    return () => { cancelled = true }
  }, [open])

  const handleSave = async () => {
    setError('')
    const fn = firstName.trim()
    const ln = lastName.trim()
    const em = email.trim()
    if (!fn) { setError('Please enter your first name.'); return }
    if (!ln) { setError('Please enter your last name.'); return }
    if (!em || !EMAIL_REGEX.test(em)) {
      setError('Please enter a valid email address.')
      return
    }
    setSubmitting(true)
    // Persist into auth.users.user_metadata so the value is available to the
    // dashboard via supabase.auth.getUser() across all devices. The DB trigger
    // (on_auth_user_change) mirrors this into public.profiles automatically.
    const { error: updateErr } = await supabase().auth.updateUser({
      email: em,
      data: { first_name: fn, last_name: ln, email: em },
    })
    setSubmitting(false)
    if (updateErr) {
      setError(updateErr.message || 'Could not save your details. Try again.')
      return
    }
    toast.success('Thanks — your details are saved.')
    onSaved()
  }

  const inputCls =
    'w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/60 transition-all disabled:opacity-60'

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !submitting) onDismiss() }}>
      <DialogContent
        showCloseButton={false}
        className="p-0 max-w-md overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] flex flex-col gap-0"
      >
        {/* Hero header */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent border-b border-[var(--border-light)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-text)] shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogHeader className="space-y-0">
                <DialogTitle className="oracle-serif italic text-xl text-[var(--text-primary)] leading-tight">
                  A quick intro before we continue
                </DialogTitle>
                <DialogDescription className="text-[13px] text-[var(--text-secondary)] mt-1">
                  Help LexRam personalise responses and email summaries.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] inline-flex items-center gap-1.5">
                <User className="w-3 h-3" /> First name
              </label>
              <input
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={submitting}
                placeholder="Bala"
                autoComplete="given-name"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Last name
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={submitting}
                placeholder="Ravikumar"
                autoComplete="family-name"
                className={inputCls}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] inline-flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="you@chambers.com"
              autoComplete="email"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              className={inputCls}
            />
            <p className="text-[10px] text-[var(--text-muted)]">
              Used for receipts and password reset codes. We won&apos;t spam you.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-b from-transparent to-[var(--surface-hover)]/30 border-t border-[var(--border-light)] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onDismiss}
            disabled={submitting}
            className="text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold shadow-md transition-all',
              'bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] hover:shadow-lg hover:-translate-y-[1px]',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0'
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              'Save & continue'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
