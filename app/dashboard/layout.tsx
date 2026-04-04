'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import CommandPalette from '@/components/CommandPalette';
import ShortcutsModal from '@/app/dashboard/research-3/components/ShortcutsModal';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { MatterProvider, useMatterContext } from '@/lib/matter-context';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AuthBottomSheet from '@/components/auth/AuthBottomSheet';
import { DashboardAuthContext, type DashboardAuthContextValue } from '@/lib/dashboard-auth-context';

// Pages that can be accessed without authentication
const PUBLIC_DASHBOARD_PATHS = ['/dashboard/research-3'];

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

  // Client-side auth check — public pages are allowed without auth
  useEffect(() => {
    const hasAuth = document.cookie.split(';').some(c => c.trim().startsWith('lexram_auth='));
    const isPublicPage = PUBLIC_DASHBOARD_PATHS.some(p => pathname.startsWith(p));

    if (!hasAuth && !isPublicPage) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (hasAuth) {
      document.cookie = 'sidebar_state=true; path=/; max-age=604800';
      setIsAuthenticated(true);
    }

    setAuthChecked(true);
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
    document.cookie = 'sidebar_state=true; path=/; max-age=604800';
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
        defaultOpen={true}
        style={{ "--sidebar-width": "11rem", "--sidebar-width-icon": "3.25rem" } as React.CSSProperties}
      >
        {isAuthenticated && <AppSidebar />}

        <SidebarInset style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--bg-primary)", minHeight: "100svh" }}>
          {children}
        </SidebarInset>

        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
        <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      </SidebarProvider>

      {/* Persistent auth bar for unauthenticated users — cannot be closed */}
      {!isAuthenticated && (
        <AuthBottomSheet onAuthenticated={handleAuthenticated} />
      )}
    </DashboardAuthContext.Provider>
  );
}
