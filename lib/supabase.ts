/**
 * Supabase client (browser) usando @supabase/ssr.
 *
 * createBrowserClient grava a sessão em cookies (em vez de localStorage),
 * o que permite que o servidor leia a mesma sessão via createServerClient.
 * Isso é essencial para o fluxo cookie-based que substitui o Bearer token
 * e elimina o problema 401 nas API routes.
 */
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'extraindo' | 'pronto' | 'publicado' | 'analisando' | 'clonando' | 'erro';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  source_url: string;
  status: ProjectStatus;
  extracted_data: ExtractedData | null;
  customizations: Customizations | null;
  published_url: string | null;
  slug: string | null;
  // Novos campos para o motor de clonagem
  clone_data?: CloneData | null;
  created_at: string;
  updated_at: string;
}

export interface Extraction {
  id: string;
  project_id: string;
  raw_html: string | null;
  assets: ExtractedAssets | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ExtractedData {
  player: PlayerData | null;
  tracking: TrackingData;
  cta: CtaData;
  checkout: CheckoutData;
  page: PageData;
}

export interface PlayerData {
  type: 'convertai' | 'vturb' | 'smartplayer' | 'unknown';
  organizationId: string | null;
  playerId: string | null;
  videoId: string | null;
  m3u8Urls: string[];
  posterUrl: string | null;
  scriptSrc: string | null;
}

export interface TrackingData {
  facebookPixelId: string | null;
  utmify: boolean;
  googleAnalyticsId: string | null;
  rawScripts: string[];
}

export interface CtaData {
  delay: number | null;
  delayParam: string | null;
  buttons: CtaButton[];
}

export interface CtaButton {
  text: string;
  href: string;
  selector: string;
}

export interface CheckoutData {
  links: string[];
  primaryLink: string | null;
}

export interface PageData {
  title: string | null;
  description: string | null;
  ogImage: string | null;
  headHtml: string;
  bodyHtml: string;
}

export interface ExtractedAssets {
  m3u8Urls: string[];
  images: string[];
  scripts: string[];
  stylesheets: string[];
  fonts?: string[];
  videos?: string[];
  audios?: string[];
  jsonAnimations?: string[];
}

export interface Customizations {
  checkoutUrl: string | null;
  facebookPixelId: string | null;
  headlineText: string | null;
  subheadlineText: string | null;
  ctaButtonText: string | null;
  ctaButtonColor: string | null;
}

// ─── Clone engine types ───────────────────────────────────────────────────────

export interface CloneAssetEntry {
  url: string;
  localPath: string;
  type: 'image' | 'script' | 'stylesheet' | 'font' | 'video' | 'audio' | 'json' | 'other';
  size?: number;
  contentType?: string;
  ok: boolean;
  error?: string;
}

export interface CloneData {
  /** Quando o clone foi gerado */
  clonedAt: string;
  /** URL final (após redirects) */
  finalUrl: string;
  /** Tamanho do HTML original */
  htmlLength: number;
  /** Lista de assets baixados */
  assets: CloneAssetEntry[];
  /** Estatísticas resumidas */
  stats: {
    totalAssets: number;
    successAssets: number;
    failedAssets: number;
    totalBytes: number;
  };
  /** Aviso de Cloudflare/anti-bot detectado */
  warnings: string[];
  /** Se o motor local é recomendado */
  needsLocalEngine: boolean;
}
