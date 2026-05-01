/**
 * Helper client-side para fazer fetch com o token de autenticação do Supabase.
 * Obtém o access_token da sessão atual e o envia no header Authorization.
 */
import { supabase } from './supabase';

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
