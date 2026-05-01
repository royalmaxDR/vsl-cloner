/**
 * Helper de fetch para chamadas autenticadas ao backend interno.
 *
 * Como agora usamos cookies (via @supabase/ssr), NÃO precisamos mais
 * enviar Bearer token manualmente. O cookie de sessão é enviado
 * automaticamente pelo browser. Este helper apenas centraliza
 * `credentials: 'include'` e o Content-Type padrão.
 *
 * Mantido como `authFetch` para compatibilidade com o código existente.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
}
