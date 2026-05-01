import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

/**
 * Extrai o token Bearer do header Authorization da request.
 * Retorna null se não houver header ou token inválido.
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  return token || null;
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

/**
 * Verifica um JWT de usuário usando o admin client.
 * Retorna o user autenticado ou null se inválido.
 */
export async function verifyUserToken(token: string) {
  const admin = createSupabaseAdminClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * Helper completo: extrai token da request, verifica e retorna o user.
 * Retorna null se não autenticado.
 */
export async function authenticateRequest(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return null;
  return verifyUserToken(token);
}
