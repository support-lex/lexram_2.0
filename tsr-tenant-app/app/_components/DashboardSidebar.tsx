"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Loader2, FolderOpen, ChevronRight, LayoutList, Users, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { ORG_SLUG } from "@/lib/org-config";
import { listSidebarCases } from "@/lib/tsr-data";
import { useSession } from "./useSession";
import { OrgMark } from "./OrgMark";
import NewReportModal from "./NewReportModal";

interface Case {
  id: string;
  case_name: string;
  case_no: string;
  bank_name: string;
  status: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: "#fff7ec", text: "#680318", label: "New" },
  processing: { bg: "rgba(185,72,38,0.12)", text: "#8f3318", label: "Processing" },
  complete: { bg: "#D1FAE5", text: "#065F46", label: "Complete" },
  error: { bg: "#FEE2E2", text: "#991B1B", label: "Error" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.new;
  return (
    <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCases = useCallback(async (uid: string) => {
    try {
      const data = await listSidebarCases(uid);
      setCases(data);
    } catch {
      /* schema may not be PostgREST-exposed yet — surfaced elsewhere */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session.userId) return;
    fetchCases(session.userId);
  }, [session.userId, fetchCases]);

  // Realtime on the org schema's cases table.
  useEffect(() => {
    if (!session.userId) return;
    const uid = session.userId;
    const channel = supabase()
      .channel(`tsr-sidebar-${ORG_SLUG}`)
      .on("postgres_changes",
        { event: "INSERT", schema: ORG_SLUG, table: "cases", filter: `user_id=eq.${uid}` },
        (payload) => {
          const c = payload.new as Case;
          setCases((prev) => (prev.some((x) => x.id === c.id) ? prev : [c, ...prev]));
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: ORG_SLUG, table: "cases", filter: `user_id=eq.${uid}` },
        (payload) => {
          const u = payload.new as Case;
          setCases((prev) => prev.map((c) => (c.id === u.id ? { ...c, ...u } : c)));
        })
      .on("postgres_changes",
        { event: "DELETE", schema: ORG_SLUG, table: "cases" },
        (payload) => {
          const id = (payload.old as { id: string }).id;
          setCases((prev) => prev.filter((c) => c.id !== id));
        })
      .subscribe();
    return () => { supabase().removeChannel(channel); };
  }, [session.userId]);

  return (
    <aside className="flex flex-col w-64 h-screen sticky top-0 border-r border-maroon/10 bg-cream-soft shrink-0">
      <div className="px-4 py-4 border-b border-maroon/10">
        <OrgMark size={36} />
      </div>

      <div className="px-3 pt-3">
        <NewReportModal />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <p className="text-[10px] font-bold text-rust uppercase tracking-[0.2em] px-2 pb-1.5 pt-1">Workspace</p>

        <NavLink href="/my-cases" active={pathname === "/my-cases"} icon={LayoutList} label="My Reports" />
        {(session.membership?.role === "admin" || session.isSuper) && (
          <NavLink href="/team" active={pathname === "/team"} icon={Users} label="Team" />
        )}

        <p className="text-[10px] font-bold text-rust uppercase tracking-[0.2em] px-2 pb-1.5 pt-3">Clients</p>

        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-maroon/50" /></div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center px-2">
            <div className="w-12 h-12 rounded-2xl bg-maroon/10 grid place-items-center mb-1">
              <FolderOpen className="w-5 h-5 text-maroon/60" />
            </div>
            <p className="text-xs text-ink/60 leading-snug">No clients yet.<br />Click <strong className="text-maroon">New Report</strong> to start.</p>
          </div>
        ) : (
          cases.map((c) => {
            const isActive = pathname === `/${c.id}`;
            return (
              <Link key={c.id} href={`/${c.id}`}
                className={`group flex items-start gap-2 w-full px-3 py-2.5 rounded-xl transition-all text-left ${
                  isActive ? "bg-maroon text-cream shadow-[0_10px_24px_-14px_rgba(104,3,24,0.55)]" : "hover:bg-maroon/5"
                }`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate leading-tight ${isActive ? "text-cream" : "text-ink"}`}>{c.case_name}</p>
                  <p className={`text-[11px] truncate mt-0.5 ${isActive ? "text-cream/70" : "text-ink/45"}`}>{c.case_no}</p>
                  <div className="mt-1.5"><StatusBadge status={c.status} /></div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 mt-0.5 shrink-0 transition-opacity ${isActive ? "opacity-80 text-cream" : "opacity-0 group-hover:opacity-50 text-maroon"}`} />
              </Link>
            );
          })
        )}
      </nav>

      <div className="p-3 border-t border-maroon/10">
        <div className="px-2 text-[11px] text-ink/55 truncate mb-2">{session.email}</div>
        <button onClick={() => session.signOut().then(() => router.replace("/login"))}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink/70 hover:bg-maroon/5 transition">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}

function NavLink({ href, active, icon: Icon, label }: { href: string; active: boolean; icon: typeof Users; label: string }) {
  return (
    <Link href={href}
      className={`group flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${
        active ? "bg-maroon text-cream shadow-[0_10px_24px_-14px_rgba(104,3,24,0.55)]" : "text-ink/80 hover:bg-maroon/5 hover:text-ink border border-maroon/10"
      }`}>
      <Icon className={`w-4 h-4 ${active ? "" : "text-rust"}`} />
      <span>{label}</span>
    </Link>
  );
}
