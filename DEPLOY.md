# VSL Cloner — Deploy Guide

## Stack
- **Framework**: Next.js 15 (App Router)
- **Database + Auth**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS 4

---

## 1. Supabase Setup

1. Create a project at https://supabase.com
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. In **Authentication → Settings**, enable Email/Password sign-in
4. Copy your credentials from **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## 2. Environment Variables

Set these in Vercel (or `.env.local` for local dev):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

---

## 3. Vercel Deploy

Connect the GitHub repo `royalmaxDR/Next-Enterprise` to Vercel for automatic deploys on push.

Or via CLI:
```bash
npm i -g vercel
vercel --prod
```

---

## 4. Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

---

## Database Schema

### `public.projects`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| name | text | Project name |
| source_url | text | Original VSL URL |
| status | text | `extraindo` \| `pronto` \| `publicado` |
| extracted_data | jsonb | Full extraction result |
| customizations | jsonb | User's edits |
| published_url | text | Public URL after publish |
| slug | text | URL slug for /p/[slug] |

### `public.extractions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| project_id | uuid | References projects |
| raw_html | text | Original page HTML |
| assets | jsonb | Extracted assets inventory |
| metadata | jsonb | Extraction metadata |
