'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import CommandPalette from '@/components/CommandPalette';
import ShortcutsModal from '@/app/dashboard/research-3/components/ShortcutsModal';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { MatterProvider, useMatterContext } from '@/lib/matter-context';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AuthBottomSheet from '@/components/auth/AuthBottomSheet';
import BackendHealthBadge from '@/components/BackendHealthBadge';
import { DashboardAuthContext, type DashboardAuthContextValue } from '@/lib/dashboard-auth-context';
import { supabase } from '@/lib/supabase/client';

// Pages that can be accessed without authentication
const PUBLIC_DASHBOARD_PATHS = ['/dashboard/research-3', '/dashboard/research-2'];

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
  useEffect(() => {
    const sb = supabase();
    const isPublicPage = PUBLIC_DASHBOARD_PATHS.some(p => pathname.startsWith(p));

    sb.auth.getUser().then(async ({ data }) => {
      const signedIn = !!data.user;
      if (!signedIn && !isPublicPage) {
        router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      // Hard verification gate: phone OTP is the ONLY signal that counts.
      // If the session exists but the phone is not confirmed, kick the user
      // back to /sign-in so they can finish OTP verification there.
      if (signedIn && !data.user!.phone_confirmed_at && !isPublicPage) {
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
    'cmd+shift+r': () => router.push('/dashboard/research-3'),
    'cmd+shift+d': () => router.push('/dashboard/research-3'),
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
      <SidebarProvider
        defaultOpen={false}
        style={{ "--sidebar-width": "13rem", "--sidebar-width-icon": "3.25rem" } as React.CSSProperties}
      >
        {isAuthenticated && <AppSidebar />}

        {/* Mobile-only floating menu button — opens the sidebar drawer.
            The desktop sidebar uses hover-expand which doesn't work on touch. */}
        {isAuthenticated && (
          <SidebarTrigger className="md:hidden fixed top-3 left-3 z-50 h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-md text-[var(--text-primary)]" />
        )}

        <SidebarInset
          className="dashboard-main-inset"
          style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--bg-primary)", minHeight: "100svh" }}
        >
          {children}
        </SidebarInset>

        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
        <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      </SidebarProvider>

      {/* Persistent auth bar for unauthenticated users — cannot be closed */}
      {!isAuthenticated && (
        <AuthBottomSheet onAuthenticated={handleAuthenticated} />
      )}

      {/* Backend health indicator (LexRam /health probe every 60s) */}
      {isAuthenticated && <BackendHealthBadge />}
    </DashboardAuthContext.Provider>
  );
}
