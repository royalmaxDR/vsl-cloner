import { NextRequest, NextResponse } from 'next/server';
import { extractVSL } from '@/lib/extractor';
import { authenticateRequest, createSupabaseAdminClient } from '@/lib/supabase-server';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { url, projectId } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'URL inválida. Verifique o formato.' }, { status: 400 });
    }

    const result = await extractVSL(normalizedUrl);

    if (projectId) {
      const supabase = createSupabaseAdminClient();

      await supabase
        .from('projects')
        .update({
          status: 'pronto',
          extracted_data: result.data,
        })
        .eq('id', projectId)
        .eq('user_id', user.id);

      await supabase.from('extractions').insert({
        project_id: projectId,
        raw_html: result.rawHtml.substring(0, 500000),
        assets: result.assets,
        metadata: result.metadata,
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      assets: result.assets,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('[/api/extract] Error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    if (message.includes('HTTP 4')) {
      return NextResponse.json(
        { error: `A página retornou um erro: ${message}` },
        { status: 422 }
      );
    }
    if (message.includes('timeout') || message.includes('abort')) {
      return NextResponse.json(
        { error: 'A página demorou muito para responder. Tente novamente.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: `Falha na extração: ${message}` },
      { status: 500 }
    );
  }
}
