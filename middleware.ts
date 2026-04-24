import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const RESEARCH_2_PATH = '/dashboard/research-2';

export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith('/dashboard');
  const isResearch2 = pathname.startsWith(RESEARCH_2_PATH);

  // Guests are allowed on research-2 — the page itself caps them at one
  // message before triggering the signup modal. Any other dashboard route
  // still requires auth.
  if (isDashboard && !isResearch2 && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirect', RESEARCH_2_PATH);
    return NextResponse.redirect(url);
  }

  if (isDashboard && user && !isResearch2) {
    const url = request.nextUrl.clone();
    url.pathname = RESEARCH_2_PATH;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all paths except static assets and image optimisation.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
