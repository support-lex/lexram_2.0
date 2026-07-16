import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isPublicDashboardPath } from '@/lib/public-dashboard-paths';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Supabase + auth checks entirely on public auth/payment routes —
  // they don't need session refresh and the round-trip blocks first paint.
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session cookie if needed.
  const { data: { user } } = await supabase.auth.getUser();

  const isDashboard = pathname.startsWith('/dashboard');

  // Guests can browse the resources hub, every legislation/compliance/analytics
  // page linked from it, plus research-2 (capped at one message). Admin
  // surfaces and user-data dashboards still require auth.
  if (isDashboard && !isPublicDashboardPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

const PUBLIC_PATHS = [
  '/sign-in',
  '/reset-password',
  '/payment',
  '/payment/success',
];

function isPublicPath(pathname: string) {
  if (pathname.startsWith('/_next')) return true;
  if (pathname === '/' || pathname.startsWith('/api')) return false;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export const config = {
  matcher: [
    // Only run auth checks on dashboard routes — Supabase round-trip would
    // otherwise add ~50-200 ms to every public marketing/blog/research page.
    // Public auth/payment routes are excluded entirely (they don't need
    // session refresh); static assets are excluded by Next.js defaults.
    '/dashboard/:path*',
  ],
};
