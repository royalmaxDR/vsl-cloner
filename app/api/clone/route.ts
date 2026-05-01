/**
 * POST /api/clone
 * Body: { projectId: string, mode?: 'simple' | 'browser' }
 *
 * Executa o motor de clonagem completa:
 *  1. Roda o cloneSite()
 *  2. Sobe os arquivos para Supabase Storage (bucket público "clones")
 *     em users/{userId}/projects/{projectId}/...
 *  3. Sobe o ZIP em users/{userId}/projects/{projectId}/clone.zip
 *  4. Atualiza o projeto: status=pronto + clone_data (manifesto + URLs públicas)
 *  5. Retorna { previewUrl, zipUrl, cloneData }
 *
 * Auth: cookie de sessão (getCurrentUser).
 * Runtime: nodejs (Buffer/Cheerio/JSZip não rodam em Edge).
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentUser,
  createSupabaseAdminClient,
} from '@/lib/supabase-server';
import { cloneSite, type CloneEngineMode } from '@/lib/clone-engine';
import type { CloneData } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BUCKET = 'clones';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { projectId, mode } = body as {
    projectId?: string;
    mode?: CloneEngineMode;
  };

  if (!projectId) {
    return NextResponse.json({ error: 'projectId obrigatório' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // 1. Carregar projeto e validar dono
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  }

  // 2. Marca como clonando
  await supabase
    .from('projects')
    .update({ status: 'clonando' })
    .eq('id', projectId)
    .eq('user_id', user.id);

  // 3. Roda o motor
  let result;
  try {
    result = await cloneSite(project.source_url, { mode: mode || 'simple' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido no motor';
    await supabase
      .from('projects')
      .update({ status: 'erro' })
      .eq('id', projectId)
      .eq('user_id', user.id);
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  // 4. Limpa pasta antiga e sobe arquivos
  const baseFolder = `users/${user.id}/projects/${projectId}`;

  // Apaga arquivos antigos (best effort)
  try {
    const { data: existing } = await supabase.storage.from(BUCKET).list(baseFolder, {
      limit: 1000,
    });
    if (existing && existing.length > 0) {
      const paths = existing.map((f) => `${baseFolder}/${f.name}`);
      await supabase.storage.from(BUCKET).remove(paths);
    }
  } catch {
    /* ignora */
  }

  // Upload de cada asset + index.html + manifest + zip
  const uploads: Promise<{ name: string; ok: boolean; error?: string }>[] = [];
  for (const [name, buf] of result.files.entries()) {
    const path = `${baseFolder}/${name}`;
    const contentType = guessContentType(name);
    uploads.push(
      supabase.storage
        .from(BUCKET)
        .upload(path, buf, { contentType, upsert: true, cacheControl: '3600' })
        .then((r) => ({
          name,
          ok: !r.error,
          error: r.error?.message,
        }))
    );
  }

  // ZIP
  const zipPath = `${baseFolder}/clone.zip`;
  uploads.push(
    supabase.storage
      .from(BUCKET)
      .upload(zipPath, result.zip, {
        contentType: 'application/zip',
        upsert: true,
        cacheControl: '3600',
      })
      .then((r) => ({
        name: 'clone.zip',
        ok: !r.error,
        error: r.error?.message,
      }))
  );

  const uploadResults = await Promise.all(uploads);
  const failed = uploadResults.filter((u) => !u.ok);

  // 5. URLs públicas
  const previewUrl = supabase.storage
    .from(BUCKET)
    .getPublicUrl(`${baseFolder}/index.html`).data.publicUrl;
  const zipUrl = supabase.storage.from(BUCKET).getPublicUrl(zipPath).data.publicUrl;

  // 6. Atualizar projeto
  const cloneData: CloneData & { previewUrl?: string; zipUrl?: string } = {
    ...result.cloneData,
    previewUrl,
    zipUrl,
  };

  await supabase
    .from('projects')
    .update({
      status: 'pronto',
      clone_data: cloneData,
    })
    .eq('id', projectId)
    .eq('user_id', user.id);

  return NextResponse.json({
    success: true,
    previewUrl,
    zipUrl,
    cloneData,
    uploadStats: {
      total: uploadResults.length,
      success: uploadResults.length - failed.length,
      failed: failed.length,
      failedSamples: failed.slice(0, 5),
    },
  });
}

function guessContentType(name: string): string {
  if (name.endsWith('.html')) return 'text/html; charset=utf-8';
  if (name.endsWith('.css')) return 'text/css; charset=utf-8';
  if (name.endsWith('.js') || name.endsWith('.mjs')) return 'application/javascript';
  if (name.endsWith('.json')) return 'application/json';
  if (name.endsWith('.svg')) return 'image/svg+xml';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  if (name.endsWith('.ico')) return 'image/x-icon';
  if (name.endsWith('.mp4')) return 'video/mp4';
  if (name.endsWith('.webm')) return 'video/webm';
  if (name.endsWith('.mp3')) return 'audio/mpeg';
  if (name.endsWith('.woff2')) return 'font/woff2';
  if (name.endsWith('.woff')) return 'font/woff';
  if (name.endsWith('.ttf')) return 'font/ttf';
  if (name.endsWith('.otf')) return 'font/otf';
  return 'application/octet-stream';
}
