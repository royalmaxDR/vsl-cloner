import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import type { ExtractedData, Customizations } from '@/lib/supabase';
import PublishedPageRenderer from '@/components/PublishedPageRenderer';

// This page is publicly accessible — no auth required
export const revalidate = 60; // ISR: revalidate every 60 seconds

async function getPublishedProject(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, source_url, status, extracted_data, customizations, published_url, slug')
    .eq('slug', slug)
    .eq('status', 'publicado')
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return { title: 'Página não encontrada' };

  const extracted = project.extracted_data as ExtractedData | null;
  const custom = project.customizations as Customizations | null;

  return {
    title: custom?.headlineText || extracted?.page?.title || project.name,
    description: custom?.subheadlineText || extracted?.page?.description || '',
    openGraph: {
      images: extracted?.page?.ogImage ? [extracted.page.ogImage] : [],
    },
  };
}

export default async function PublishedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);

  if (!project) {
    notFound();
  }

  const extracted = project.extracted_data as ExtractedData | null;
  const customizations = project.customizations as Customizations | null;

  return (
    <PublishedPageRenderer
      extracted={extracted}
      customizations={customizations}
      projectName={project.name}
    />
  );
}
