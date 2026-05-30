'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Loader2, FolderOpen,
  ChevronRight,
  LayoutList, Users, Crown, Inbox,
} from 'lucide-react'
import { useRoleContext } from '@/lib/rbac'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'
import type { User as SbUser } from '@supabase/supabase-js'

// TSR data + auth both live on the main lexram supabase. RLS on cases /
// documents enforces auth.uid() = user_id, so every signed-in lexram user
// automatically gets isolated TSR storage. See:
//   supabase/migrations/20260522_tsr_cases.sql
const authClient = supabase

interface Case {
  id:         string
  case_name:  string
  case_no:    string
  bank_name:  string
  status:     string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new:        { bg: '#fff7ec',         text: '#680318',  label: 'New'        },
  processing: { bg: 'rgba(185,72,38,0.12)', text: '#8f3318',  label: 'Processing' },
  complete:   { bg: '#D1FAE5',         text: '#065F46',  label: 'Complete'   },
  error:      { bg: '#FEE2E2',         text: '#991B1B',  label: 'Error'      },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.new
  return (
    <span
      className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

export default function DashboardSidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const { role } = useRoleContext()

  const [user,         setUser]         = useState<SbUser | null>(null)
  const [cases,        setCases]        = useState<Case[]>([])
  const [loading,      setLoading]      = useState(true)

  const fetchCases = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('tsr_clients')
      .select('id, case_name, case_no, bank_name, status')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (!error && data) setCases(data)
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data: { session } } = await authClient.auth.getSession()
      if (!session) { router.replace('/sign-in'); return }
      if (!mounted) return
      setUser(session.user)
      await fetchCases(session.user.id)
      setLoading(false)
    }

    init()

    const { data: { subscription } } = authClient.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/sign-in')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, fetchCases])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('tsr-sidebar-cases')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tsr_clients', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newCase = payload.new as Case
          setCases(prev =>
            prev.some(c => c.id === newCase.id) ? prev : [newCase, ...prev]
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tsr_clients', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Case
          setCases(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tsr_clients' },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          setCases(prev => prev.filter(c => c.id !== deletedId))
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return (
    <>
      <aside className="flex flex-col w-64 h-full border-r border-maroon/10 bg-cream-soft shrink-0">

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {/* Workspace overview links (sit above the per-client list) */}
          <p className="text-[10px] font-bold text-rust uppercase tracking-[0.2em] px-2 pb-1.5 pt-1">
            Workspace
          </p>
          <Link
            href="/dashboard/tsr/my-cases"
            className={`group flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${
              pathname === '/dashboard/tsr/my-cases'
                ? 'bg-maroon text-cream shadow-[0_10px_24px_-14px_rgba(104,3,24,0.55)]'
                : 'text-ink/80 hover:bg-maroon/5 hover:text-ink border border-maroon/10'
            }`}
          >
            <LayoutList className={`w-4 h-4 ${pathname === '/dashboard/tsr/my-cases' ? '' : 'text-rust'}`} />
            <span>My Reports</span>
          </Link>

          {/* Org admin: team management link */}
          {role === 'admin' && (
            <Link
              href="/dashboard/tsr/team"
              className={`group flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${
                pathname === '/dashboard/tsr/team'
                  ? 'bg-maroon text-cream shadow-[0_10px_24px_-14px_rgba(104,3,24,0.55)]'
                  : 'text-ink/80 hover:bg-maroon/5 hover:text-ink border border-maroon/10'
              }`}
            >
              <Users className={`w-4 h-4 ${pathname === '/dashboard/tsr/team' ? '' : 'text-rust'}`} />
              <span>Team</span>
            </Link>
          )}

          {/* Super admin: organisations management + requests inbox */}
          {role === 'super_admin' && (
            <>
              <Link
                href="/dashboard/tsr/admin"
                className={`group flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${
                  pathname === '/dashboard/tsr/admin' || (pathname.startsWith('/dashboard/tsr/admin/') && !pathname.startsWith('/dashboard/tsr/admin/requests'))
                    ? 'bg-maroon text-cream shadow-[0_10px_24px_-14px_rgba(104,3,24,0.55)]'
                    : 'text-ink/80 hover:bg-maroon/5 hover:text-ink border border-maroon/10'
                }`}
              >
                <Crown className={`w-4 h-4 ${pathname.startsWith('/dashboard/tsr/admin') && !pathname.startsWith('/dashboard/tsr/admin/requests') ? '' : 'text-rust'}`} />
                <span>Organisations</span>
              </Link>
              <Link
                href="/dashboard/tsr/admin/requests"
                className={`group flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-2 ${
                  pathname.startsWith('/dashboard/tsr/admin/requests')
                    ? 'bg-maroon text-cream shadow-[0_10px_24px_-14px_rgba(104,3,24,0.55)]'
                    : 'text-ink/80 hover:bg-maroon/5 hover:text-ink border border-maroon/10'
                }`}
              >
                <Inbox className={`w-4 h-4 ${pathname.startsWith('/dashboard/tsr/admin/requests') ? '' : 'text-rust'}`} />
                <span>Requests</span>
              </Link>
            </>
          )}

          <p className="text-[10px] font-bold text-rust uppercase tracking-[0.2em] px-2 pb-1.5 pt-3">
            Clients
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-maroon/50" />
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center px-2">
              <div className="w-12 h-12 rounded-2xl bg-maroon/10 grid place-items-center mb-1">
                <FolderOpen className="w-5 h-5 text-maroon/60" />
              </div>
              <p className="text-xs text-ink/60 leading-snug">
                No clients yet.<br />Click <strong className="text-maroon">+ New Client</strong> to start.
              </p>
            </div>
          ) : (
            cases.map(c => {
              const isActive = pathname === `/dashboard/tsr/${c.id}`
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/tsr/${c.id}`}
                  className={`group flex items-start gap-2 w-full px-3 py-2.5 rounded-xl transition-all text-left ${
                    isActive
                      ? 'bg-maroon text-cream shadow-[0_10px_24px_-14px_rgba(104,3,24,0.55)]'
                      : 'hover:bg-maroon/5'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate leading-tight ${isActive ? 'text-cream' : 'text-ink'}`}>
                      {c.case_name}
                    </p>
                    <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-cream/70' : 'text-ink/45'}`}>
                      {c.case_no}
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 transition-opacity ${isActive ? 'opacity-80 text-cream' : 'opacity-0 group-hover:opacity-50 text-maroon'}`}
                  />
                </Link>
              )
            })
          )}
        </nav>
      </aside>
    </>
  )
}
