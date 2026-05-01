/**
 * API Routes para CRUD de projetos.
 *
 * Auth: usa cookie de sessão Supabase (@supabase/ssr) via getCurrentUser().
 * Isso elimina o problema 401 que ocorria quando o dashboard não enviava
 * o Bearer token. Como o cookie já é enviado automaticamente pelo browser,
 * basta validar a sessão server-side.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentUser,
  createSupabaseAdminClient,
} from '@/lib/supabase-server';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, source_url } = body as { name?: string; source_url?: string };

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  }
  if (!source_url || typeof source_url !== 'string' || !source_url.trim()) {
    return NextResponse.json({ error: 'URL obrigatória' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: name.trim(),
      source_url: source_url.trim(),
      status: 'extraindo',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data }, { status: 201 });
}
