'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import CommandPalette from '@/components/CommandPalette';
import ShortcutsModal from '@/app/dashboard/research-3/components/ShortcutsModal';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { MatterProvider, useMatterContext } from '@/lib/matter-context';
import { AppTopBar } from '@/components/app-topbar';
import { TourProvider } from '@/components/tour/TourProvider';
import AuthBottomSheet from '@/components/auth/AuthBottomSheet';
import BackendHealthBadge from '@/components/BackendHealthBadge';
import { DashboardAuthContext, type DashboardAuthContextValue } from '@/lib/dashboard-auth-context';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-provider';
import { isPublicDashboardPath } from '@/lib/public-dashboard-paths';
import { purgeLegacyStorage, evictStaleStorage } from '@/lib/storage';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MatterProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </MatterProvider>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useMatterContext();
  const pathname = usePathname();
  const router = useRouter();

  // Auth comes from the single source of truth (lib/auth-store via useAuth).
  // `ready` flips once Supabase's first getSession() has resolved. The
  // server-side middleware is the authoritative gate; this effect only mirrors
  // the in-page UI and enforces the phone-OTP verification gate.
  const { user, ready: authChecked } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!authChecked) return;
    const isPublicPage = isPublicDashboardPath(pathname);

    if (!user && !isPublicPage) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    // Hard verification gate: phone OTP is the ONLY signal that counts. If the
    // session exists but the phone is not confirmed, kick the user back to
    // /sign-in so they can finish OTP verification there.
    if (user && !user.phone_confirmed_at && !isPublicPage) {
      supabase().auth.signOut();
      router.replace('/sign-in?reason=unverified');
      return;
    }
    if (user) {
      document.cookie = 'sidebar_state=false; path=/; max-age=604800';
    }
  }, [authChecked, user, pathname, router]);

  // ── localStorage hygiene ───────────────────────────────────────────────────
  // 1. Purge dead legacy keys once per load (old full-session blobs that nothing
  //    writes anymore but that bloat storage toward quota — see lib/storage.ts).
  // 2. Actually act on the storage-pressure events that lib/storage.ts dispatches
  //    (previously nothing listened, so the warning was console-only and no
  //    cleanup ever happened): on a warning, re-purge legacy keys; on an actual
  //    quota error, evict the disposable caches so subsequent writes succeed.
  useEffect(() => {
    purgeLegacyStorage();
    const onWarning = () => purgeLegacyStorage();
    const onError = () => evictStaleStorage();
    window.addEventListener('lexram:storage-warning', onWarning);
    window.addEventListener('lexram:storage-error', onError);
    return () => {
      window.removeEventListener('lexram:storage-warning', onWarning);
      window.removeEventListener('lexram:storage-error', onError);
    };
  }, []);

  useKeyboardShortcuts({
    'cmd+k':       () => setIsCommandPaletteOpen(true),
    'ctrl+k':      () => setIsCommandPaletteOpen(true),
    'cmd+shift+r': () => router.push('/dashboard/research-2'),
    'cmd+shift+d': () => router.push('/dashboard/research-2'),
    'cmd+shift+b': () => router.push('/dashboard/matters'),
    'cmd+shift+m': () => router.push('/dashboard/matters'),
    '?':           () => setShowShortcuts(true),
    'esc':         () => {
      setIsCommandPaletteOpen(false);
      setShowShortcuts(false);
    },
  });

  const handleAuthenticated = () => {
    // The auth store's onAuthStateChange flips isAuthenticated automatically
    // once Supabase emits SIGNED_IN; we just persist the sidebar preference.
    document.cookie = 'sidebar_state=false; path=/; max-age=604800';
  };

  if (!authChecked) return null;

  const authContextValue: DashboardAuthContextValue = {
    isAuthenticated,
    showAuthSheet: () => {},
    markAuthenticated: handleAuthenticated,
  };

  return (
    <DashboardAuthContext.Provider value={authContextValue}>
      <TourProvider>
        <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
          <AppTopBar />
          <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {children}
          </main>

          <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
          <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
        </div>
      </TourProvider>

      {/* Sign-up nudge only on research-2 (1-message guest cap surface).
          Resources / legislation / analytics pages stay fully public. */}
      {!isAuthenticated && pathname.startsWith('/dashboard/research-2') && (
        <AuthBottomSheet onAuthenticated={handleAuthenticated} />
      )}

      {/* Backend health indicator (LexRam /health probe every 60s) */}
      {isAuthenticated && <BackendHealthBadge />}
    </DashboardAuthContext.Provider>
  );
}
