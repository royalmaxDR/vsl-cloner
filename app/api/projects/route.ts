import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createSupabaseAdminClient } from '@/lib/supabase-server';

// GET /api/projects — list user's projects
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ projects: data });
  } catch (error) {
    console.error('[GET /api/projects]', error);
    return NextResponse.json({ error: 'Erro ao buscar projetos' }, { status: 500 });
  }
}

// POST /api/projects — create new project
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, source_url } = body;

    if (!name || !source_url) {
      return NextResponse.json(
        { error: 'Nome e URL são obrigatórios' },
        { status: 400 }
      );
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

    if (error) throw error;

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/projects]', error);
    return NextResponse.json({ error: 'Erro ao criar projeto' }, { status: 500 });
  }
}
