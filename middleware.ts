import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth pages — pass through without checking session to avoid loop
  const authPaths = ['/login', '/signup'];
  const isAuthPage = authPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Protected routes
  const protectedPaths = ['/dashboard', '/editor'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // If it's neither auth nor protected, just pass through
  if (!isAuthPage && !isProtected) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getSession (reads from cookie) instead of getUser (makes network call)
  // This avoids timing issues with cookie propagation after login
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthenticated = !!session;

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    const destination =
      redirectTo && redirectTo.startsWith('/') && !authPaths.includes(redirectTo)
        ? redirectTo
        : '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, public assets
     * - /p/ (public published pages)
     * - /api/ (API routes handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|public|p/|api/).*)',
  ],
};
