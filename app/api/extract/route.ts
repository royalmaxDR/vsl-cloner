import { NextRequest, NextResponse } from 'next/server';
import { extractVSL } from '@/lib/extractor';
import { createSupabaseRouteClient } from '@/lib/supabase-server';

export const maxDuration = 30; // Vercel function timeout

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = createSupabaseRouteClient(request);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const user = session.user;

    const body = await request.json();
    const { url, projectId } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    // Validate URL format
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'URL inválida. Verifique o formato.' }, { status: 400 });
    }

    // Run extraction
    const result = await extractVSL(normalizedUrl);

    // If projectId provided, update project and save extraction record
    if (projectId) {
      // Update project status to 'pronto' with extracted data
      await supabase
        .from('projects')
        .update({
          status: 'pronto',
          extracted_data: result.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .eq('user_id', user.id);

      // Save extraction record (without raw HTML to keep response lean)
      await supabase.from('extractions').insert({
        project_id: projectId,
        raw_html: result.rawHtml.substring(0, 500000), // limit to 500KB
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
