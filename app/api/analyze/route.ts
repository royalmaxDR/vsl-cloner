/**
 * POST /api/analyze
 * Body: { url: string }
 *
 * Faz uma análise leve da URL: baixa o HTML com headers de Chrome,
 * detecta o player VSL, faz inventário de assets (sem baixar),
 * detecta proteções tipo Cloudflare e retorna um relatório para a UI.
 *
 * É a primeira tela do fluxo: usuário cola URL → vê o que foi
 * encontrado → decide se vai clonar tudo.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase-server';
import { extractVSL } from '@/lib/extractor';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { url } = (await request.json().catch(() => ({}))) as { url?: string };
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
  }

  let normalized = url.trim();
  if (!normalized.startsWith('http')) normalized = `https://${normalized}`;

  try {
    new URL(normalized);
  } catch {
    return NextResponse.json({ error: 'URL malformada' }, { status: 400 });
  }

  try {
    const result = await extractVSL(normalized);
    return NextResponse.json({
      success: true,
      url: normalized,
      data: result.data,
      assets: result.assets,
      metadata: result.metadata,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    const isBlock = /403|cloudflare|bloqueia|anti-bot/i.test(msg);
    return NextResponse.json(
      {
        error: msg,
        needsLocalEngine: isBlock,
      },
      { status: isBlock ? 422 : 500 }
    );
  }
}
