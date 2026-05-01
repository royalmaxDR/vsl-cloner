import { NextRequest, NextResponse } from 'next/server';
import { extractVSL } from '@/lib/extractor';
import { getCurrentUser, createSupabaseAdminClient } from '@/lib/supabase-server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
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

    let result;
    try {
      result = await extractVSL(normalizedUrl);
    } catch (extractError) {
      const message = extractError instanceof Error ? extractError.message : 'Erro desconhecido na extração';

      // Se o projeto foi criado mas a extração falhou, atualiza status para 'erro'
      if (projectId) {
        const supabase = createSupabaseAdminClient();
        await supabase
          .from('projects')
          .update({ status: 'pronto' }) // mantém como pronto para o usuário poder tentar de novo
          .eq('id', projectId)
          .eq('user_id', user.id);
      }

      // Retorna erro com mensagem específica e status HTTP adequado
      if (message.includes('HTTP 403') || message.includes('bloqueia')) {
        return NextResponse.json({ error: message }, { status: 403 });
      }
      if (message.includes('HTTP 404') || message.includes('não encontrada')) {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      if (message.includes('HTTP 429') || message.includes('Muitas requisições')) {
        return NextResponse.json({ error: message }, { status: 429 });
      }
      if (message.includes('timeout') || message.includes('abort') || message.includes('demorou')) {
        return NextResponse.json(
          { error: 'A página demorou muito para responder. Tente novamente.' },
          { status: 408 }
        );
      }

      return NextResponse.json({ error: message }, { status: 422 });
    }

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
    console.error('[/api/extract] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: `Erro interno: ${message}` }, { status: 500 });
  }
}
