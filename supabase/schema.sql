-- VSL Cloner — Supabase Schema
-- Run this in the Supabase SQL Editor to set up the database

-- ─── Projects table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  source_url      text NOT NULL,
  status          text NOT NULL DEFAULT 'extraindo'
                  CHECK (status IN ('extraindo', 'pronto', 'publicado')),
  extracted_data  jsonb,
  customizations  jsonb,
  published_url   text,
  slug            text UNIQUE,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- ─── Extractions table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.extractions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  raw_html    text,
  assets      jsonb,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view published projects"
  ON public.projects FOR SELECT
  USING (status = 'publicado');

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Extractions policies
CREATE POLICY "Users can view own extractions"
  ON public.extractions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own extractions"
  ON public.extractions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

-- ─── Auto-update trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.projects;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
