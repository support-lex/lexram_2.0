"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-provider";
import type { UserRole } from "@/types/law-firm";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

// Role is derived in the single auth store from user_metadata.role and stays
// reactive across SIGNED_IN / TOKEN_REFRESHED. Previously this hook fired a
// one-shot getUser() with no listener, so a probe that resolved before session
// hydration left `role` null until a manual refresh (the admin "Make blog"
// button was the visible casualty).
export function useUserRole(): { role: UserRole | null; loading: boolean } {
  const { role, ready } = useAuth();
  return { role, loading: !ready };
}

export function AuthGuard({ children, allowedRoles, fallback }: AuthGuardProps) {
  const { role, loading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !role) router.push("/sign-in");
    if (!loading && role && !allowedRoles.includes(role)) router.push("/dashboard");
  }, [loading, role, allowedRoles, router]);

  if (loading) return fallback ?? <div className="flex items-center justify-center h-screen text-[var(--text-muted)]">Loading...</div>;
  if (!role || !allowedRoles.includes(role)) return null;

  return <>{children}</>;
}
