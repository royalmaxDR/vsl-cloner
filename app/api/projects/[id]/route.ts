import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET /api/projects/[id] — get single project
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('[GET /api/projects/[id]]', error);
    return NextResponse.json({ error: 'Erro ao buscar projeto' }, { status: 500 });
  }
}

// PUT /api/projects/[id] — update project customizations
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, customizations, status } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (customizations !== undefined) updateData.customizations = customizations;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('[PUT /api/projects/[id]]', error);
    return NextResponse.json({ error: 'Erro ao atualizar projeto' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/projects/[id]]', error);
    return NextResponse.json({ error: 'Erro ao deletar projeto' }, { status: 500 });
  }
}
