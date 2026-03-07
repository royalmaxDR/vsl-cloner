-- Enable UUID extension for generating unique IDs
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
-- Extends the default Supabase auth.users table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  level text default 'Iniciante',
  is_premium boolean default false,
  is_verified boolean default false,
  tasks_today integer default 0,
  tasks_completed_total integer default 0,
  pix_key text,
  is_community_member boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. JOBS TABLE
-- Stores available missions/tasks
create table public.jobs (
  id text primary key, -- Using text ID from the generator (e.g., JOB-AUDIT-1001)
  category text not null,
  type text not null,
  company text not null,
  title text not null,
  value numeric(10,2) not null,
  logo_url text,
  level_required integer default 1,
  currency text default 'BRL',
  duration text,
  description text,
  briefing jsonb, -- Stores the briefing object structure
  steps jsonb, -- Stores the steps array
  evidence_config jsonb, -- Stores evidence requirements
  job_data jsonb, -- Stores specific job data (transactions, videos, etc.)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. USER_JOBS TABLE
-- Tracks user progress and completion of jobs
create table public.user_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  job_id text references public.jobs(id) not null,
  status text check (status in ('completed', 'failed', 'in_progress')) not null,
  earnings numeric(10,2) not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  evidence_submitted text, -- The text report submitted by user
  quality_score integer -- The score achieved
);

-- 4. WALLET_TRANSACTIONS TABLE
-- Financial history
create table public.wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  amount numeric(10,2) not null,
  type text check (type in ('earning', 'withdrawal', 'bonus')) not null,
  status text check (status in ('available', 'analysis', 'pending', 'paid')) default 'analysis',
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ACADEMY_PROGRESS TABLE
-- Tracks completed courses
create table public.academy_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  module_id text not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, module_id)
);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.user_jobs enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.academy_progress enable row level security;

-- PROFILES POLICIES
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- JOBS POLICIES
create policy "Jobs are viewable by everyone" on public.jobs
  for select using (true);

-- USER_JOBS POLICIES
create policy "Users can view own job history" on public.user_jobs
  for select using (auth.uid() = user_id);

create policy "Users can insert own job completion" on public.user_jobs
  for insert with check (auth.uid() = user_id);

-- WALLET POLICIES
create policy "Users can view own wallet" on public.wallet_transactions
  for select using (auth.uid() = user_id);

-- ACADEMY POLICIES
create policy "Users can view own academy progress" on public.academy_progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own academy progress" on public.academy_progress
  for insert with check (auth.uid() = user_id);

-- TRIGGERS AND FUNCTIONS

-- Function to handle new user creation automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SEED DATA EXAMPLE (Optional - Run this to add initial jobs manually if not using the generator script)
/*
insert into public.jobs (id, category, type, company, title, value, level_required, currency, duration, description, briefing, steps, evidence_config, job_data)
values 
('JOB-TEST-001', 'Iniciante', 'ad', 'TikTok', 'Teste de Moderação', 50.00, 1, 'BRL', '15 min', 'Descrição teste', '{}', '[]', '{}', '{}');
*/
