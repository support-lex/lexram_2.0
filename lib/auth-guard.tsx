"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { UserRole } from "@/types/law-firm";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function useUserRole(): { role: UserRole | null; loading: boolean } {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase().auth.getUser();
      if (!data.user) { setLoading(false); return; }
      // Role is stored in user_metadata.role (set during signup or by admin)
      const r = (data.user.user_metadata?.role as UserRole) || "advocate";
      setRole(r);
      setLoading(false);
    })();
  }, []);

  return { role, loading };
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
