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
    // Skip static assets, image optimisation, AND public auth/payment routes.
    // Auth pages handle their own Supabase calls — running the middleware
    // there just adds a cold network round-trip to the first paint.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
