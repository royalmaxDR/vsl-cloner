import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (bypasses RLS) — use only in API routes
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    // Fallback to anon key if service role not set (limited functionality)
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'extraindo' | 'pronto' | 'publicado';

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
}

export interface Customizations {
  checkoutUrl: string | null;
  facebookPixelId: string | null;
  headlineText: string | null;
  subheadlineText: string | null;
  ctaButtonText: string | null;
  ctaButtonColor: string | null;
}
