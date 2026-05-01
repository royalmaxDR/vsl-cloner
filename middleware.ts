/**
 * Middleware Next.js para refresh da sessão Supabase em cada request.
 *
 * Sem isso, cookies de sessão expiram e route handlers começam a retornar 401.
 * O middleware roda em Edge runtime e atualiza o cookie de sessão antes
 * de qualquer page/API ser executada.
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Apenas refresca a sessão. Não bloqueia rota — autorização é feita nas APIs.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Aplica em tudo, exceto assets estáticos e rotas públicas de imagens.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
