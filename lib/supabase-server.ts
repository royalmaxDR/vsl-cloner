/**
 * Supabase server-side helpers using @supabase/ssr (cookie-based auth).
 *
 * Esta abordagem elimina o problema 401 que ocorria quando o dashboard
 * dependia de enviar manualmente o Bearer token nas chamadas fetch.
 *
 * - createSupabaseServerClient(): client autenticado pelo cookie da sessão.
 *   Use em route handlers e server components para ler/escrever respeitando RLS.
 * - createSupabaseAdminClient(): client com service_role (bypass RLS).
 *   Use somente quando precisar atualizar dados após validar o usuário.
 * - getCurrentUser(): helper que retorna o user autenticado do cookie ou null.
 */
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Cria um client Supabase server-side que lê a sessão dos cookies.
 * No Next.js 15 (App Router), `cookies()` é assíncrono.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
          // Em route handlers GET sem mutação de resposta, set pode falhar.
          // Ignoramos silenciosamente — o middleware/refresh cuida disso.
        }
      },
    },
  });
}

/**
 * Helper completo: retorna o user autenticado do cookie ou null.
 * Use em qualquer route handler como primeira linha de defesa.
 */
export async function getCurrentUser() {
  // Modo dev local: pula autenticação quando LOCAL_CLONE_NO_AUTH=1.
  // Útil para rodar `next dev` sem Supabase configurado, expondo o motor
  // local sem precisar criar usuário. NUNCA defina essa env em produção.
  if (process.env.LOCAL_CLONE_NO_AUTH === '1') {
    return {
      id: 'local-dev-user',
      email: 'local@dev',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof verifyUserToken>>;
  }
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Cria um client Supabase com service_role_key (acesso total, server-side only).
 * Use apenas em API routes — NUNCA exponha no client-side.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ─── Compatibilidade retroativa (Bearer token) ──────────────────────────────
// Mantido para o caso de chamadas externas/CLI que ainda enviem Authorization.

export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  return token || null;
}

export async function verifyUserToken(token: string) {
  const admin = createSupabaseAdminClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * Tenta autenticar a request por (1) cookie de sessão (preferido)
 * ou (2) Bearer token (fallback). Retorna o user ou null.
 */
export async function authenticateRequest(request: NextRequest) {
  // 1. Tenta cookie-based (preferido)
  const cookieUser = await getCurrentUser();
  if (cookieUser) return cookieUser;

  // 2. Fallback: Bearer token
  const token = extractBearerToken(request);
  if (!token) return null;
  return verifyUserToken(token);
}
