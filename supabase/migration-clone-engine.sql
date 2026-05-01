-- Migração: adicionar suporte ao motor de clonagem completa
-- Execute uma única vez no SQL Editor do Supabase.

-- 1) Permitir novos status
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('extraindo', 'analisando', 'clonando', 'pronto', 'publicado', 'erro'));

-- 2) Coluna clone_data com o resultado do clonador
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS clone_data jsonb;

-- 3) Índice para buscas por user_id + status
CREATE INDEX IF NOT EXISTS projects_user_status_idx
  ON public.projects (user_id, status);
