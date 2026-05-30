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
import { isPublicDashboardPath } from '@/lib/public-dashboard-paths';

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
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useMatterContext();
  const pathname = usePathname();
  const router = useRouter();

  // Client-side auth check via Supabase. Middleware enforces this server-side
  // already; this just toggles the in-page UI (sidebar / bottom sheet).
  //
  // Uses getSession() (cache-only) instead of getUser() (server-verified) so
  // it does NOT acquire Supabase's auth-token Web Lock. getUser() here used
  // to serialise against every other getSession()/getUser() in the dashboard
  // subtree, and a held lock could starve hooks like useRoleContext mid-load,
  // leaving them stuck on loading=true. The middleware (server-side) is
  // already the authoritative auth gate, so trusting the cached JWT here is
  // safe — if the token is invalid, the next server request will redirect.
  useEffect(() => {
    const sb = supabase();
    const isPublicPage = isPublicDashboardPath(pathname);

    sb.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user ?? null;
      const signedIn = !!user;
      if (!signedIn && !isPublicPage) {
        router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      // Hard verification gate: phone OTP is the ONLY signal that counts.
      // If the session exists but the phone is not confirmed, kick the user
      // back to /sign-in so they can finish OTP verification there.
      if (signedIn && !user!.phone_confirmed_at && !isPublicPage) {
        await sb.auth.signOut();
        router.replace('/sign-in?reason=unverified');
        return;
      }
      if (signedIn) {
        document.cookie = 'sidebar_state=false; path=/; max-age=604800';
        setIsAuthenticated(true);
      }
      setAuthChecked(true);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, [pathname, router]);

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
    setIsAuthenticated(true);
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
