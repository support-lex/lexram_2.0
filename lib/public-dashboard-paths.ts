// Dashboard routes reachable without authentication.
// Imported by middleware.ts (server-side gate) and app/dashboard/layout.tsx (client-side gate).
// Admin surfaces (/dashboard/admin, /dashboard/crawler) are intentionally NOT here.
export const PUBLIC_DASHBOARD_PATHS = [
  '/dashboard/research-2',
  '/dashboard/resources',
  '/dashboard/acts',
  '/dashboard/amendments',
  '/dashboard/sub-legislation',
  '/dashboard/circulars',
  '/dashboard/schedules',
  '/dashboard/domains',
  '/dashboard/ministry',
  '/dashboard/timeline',
  '/dashboard/gov-docs',
  '/dashboard/case-law',
  '/dashboard/version-tracker',
  '/dashboard/matrix',
  '/dashboard/burden-index',
  '/dashboard/cross-industry',
  '/dashboard/amendment-chain',
  '/dashboard/legal-analytics',
  '/dashboard/industry-dashboard',
  '/dashboard/cross-refs',
] as const;

export function isPublicDashboardPath(pathname: string): boolean {
  return PUBLIC_DASHBOARD_PATHS.some(
    p => pathname === p || pathname.startsWith(`${p}/`),
  );
}
