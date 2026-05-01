import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

/**
 * Para uso em Server Components (sem request disponível).
 * Lê cookies do cookie store do Next.js.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies can't be set from here
          }
        },
      },
    }
  );
}

/**
 * Para uso em Route Handlers (API routes).
 * Lê cookies diretamente da NextRequest — garante que os cookies
 * de sessão do Supabase (sb-*-auth-token) sejam lidos corretamente
 * mesmo sem middleware para refresh do token.
 */
export function createSupabaseRouteClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Route handlers não precisam persistir cookies de volta
          // O cliente browser gerencia o refresh automaticamente
        },
      },
    }
  );
}
