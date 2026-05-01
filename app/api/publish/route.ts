import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createSupabaseAdminClient } from '@/lib/supabase-server';
import type { ExtractedData, Customizations } from '@/lib/supabase';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

function applyCustomizations(
  extractedData: ExtractedData,
  customizations: Customizations
): ExtractedData {
  const result = JSON.parse(JSON.stringify(extractedData)) as ExtractedData;

  if (customizations.checkoutUrl && result.checkout) {
    result.checkout.primaryLink = customizations.checkoutUrl;
    result.checkout.links = [customizations.checkoutUrl, ...result.checkout.links.slice(1)];
  }

  if (customizations.facebookPixelId && result.tracking) {
    result.tracking.facebookPixelId = customizations.facebookPixelId;
  }

  if (customizations.headlineText && result.page) {
    result.page.title = customizations.headlineText;
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    if (!project.extracted_data) {
      return NextResponse.json(
        { error: 'Projeto ainda não foi extraído. Execute a extração primeiro.' },
        { status: 422 }
      );
    }

    const baseSlug = generateSlug(project.name);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const finalData = project.customizations
      ? applyCustomizations(
          project.extracted_data as ExtractedData,
          project.customizations as Customizations
        )
      : project.extracted_data;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get('origin') ||
      'https://cloneia-swart.vercel.app';
    const publishedUrl = `${appUrl}/p/${uniqueSlug}`;

    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update({
        status: 'publicado',
        slug: uniqueSlug,
        published_url: publishedUrl,
        extracted_data: finalData,
      })
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      publishedUrl,
      slug: uniqueSlug,
      project: updated,
    });
  } catch (error) {
    console.error('[POST /api/publish]', error);
    return NextResponse.json({ error: 'Erro ao publicar projeto' }, { status: 500 });
  }
}
