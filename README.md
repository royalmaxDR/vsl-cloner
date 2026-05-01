# VSL Cloner

SaaS para **clonar funis VSL inteiros** (HTML + JS + CSS + imagens + áudios + vídeos)
e baixar como pacote ZIP standalone, com preview funcional servido a partir
do Supabase Storage.

> Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Supabase
> (Auth + Postgres + Storage) · `cheerio` + `jszip` (motor Vercel) ·
> Puppeteer (motor local opcional).

## Recursos principais

| Recurso | Onde roda | Detalhes |
| --- | --- | --- |
| **Análise rápida** (`/api/analyze`) | Vercel | Lista título, player, pixels, checkout e inventário de assets em segundos. |
| **Motor Vercel** (`/api/clone`) | Vercel (Node runtime, 60s) | Faz fetch com headers de Chrome, baixa todos os assets, reescreve paths e sobe para o bucket público `clones`. Funciona em sites VSL típicos sem proteção pesada. |
| **Motor local** (`local-engine/`) | Computador do usuário | CLI Node.js com Puppeteer full. Fura Cloudflare/SPAs e pode publicar direto no painel via API. |
| **Preview funcional** | Supabase Storage | `index.html` reescrito + assets servidos pelo CDN público do Supabase, dentro de `<iframe>` no painel. |
| **Download ZIP** | Supabase Storage | Pacote pronto para hospedar em qualquer servidor estático. |
| **Auth via cookies** | `@supabase/ssr` | Não depende mais de Bearer token — fim do erro 401. |

## Setup

### 1. Variáveis de ambiente (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://oishenwcfeyucmtmysaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### 2. Banco de dados

Rode o `supabase/schema.sql` (cria projects + extractions + RLS) e depois
`supabase/migration-clone-engine.sql` (adiciona `clone_data` e novos status).
No projeto Supabase em uso (`oishenwcfeyucmtmysaa`), a migração já foi aplicada,
e o bucket público `clones` foi criado com policies de leitura pública +
escrita autenticada/service-role.

### 3. Local

```bash
pnpm install
pnpm dev
```

## Fluxo do usuário

1. **Login** → `/login`
2. **Dashboard** → lista de projetos
3. **Novo Clone** → cola URL e nome
4. **Editor** → 3 passos visíveis:
   - **Analisar**: relatório do que foi encontrado (player VSL, pixels, etc).
   - **Clonar tudo**: baixa todos os assets via motor Vercel (ou link para
     o motor local se tiver Cloudflare).
   - **Preview & ZIP**: iframe funcional + botão de download do `.zip`.

## Por que dois motores?

Funções serverless Vercel têm **60 segundos** de execução, **memória limitada**
e **sem Chromium**. Isso é suficiente para a maioria das VSLs (HTTP simples
funciona porque a página renderiza no cliente após download dos JS).

Mas sites com Cloudflare ou JS Challenge **bloqueiam fetches diretos**.
Para esses, o usuário roda `node clone-local.mjs <URL>` no PC dele —
um Chromium completo navega de verdade, captura tudo o que é baixado
e empacota o resultado. Veja `local-engine/README.md`.

## Estrutura do projeto

```
app/
  api/
    analyze/   # análise leve da URL
    clone/     # motor de clonagem completa + upload Storage
    extract/   # extrator legado (mantido)
    projects/  # CRUD de projetos
    publish/   # publicar projeto (legado)
  dashboard/
  editor/[id]/
  p/[slug]/    # página pública publicada (legado)
components/
  NewCloneModal.tsx
  StatusBadge.tsx
lib/
  clone-engine.ts        # motor principal
  extractor.ts           # extrator de metadados/players
  supabase-server.ts     # cookies + service role
  supabase.ts            # client browser
  auth-fetch.ts          # fetch com credentials: 'include'
local-engine/            # CLI Puppeteer (cliente)
supabase/
  schema.sql
  migration-clone-engine.sql
middleware.ts            # refresh de sessão Supabase
```

## Correção do 401

Antes: as API routes esperavam `Authorization: Bearer <token>`, mas o front
não enviava — gerando 401 em tudo.

Agora: usamos **`@supabase/ssr`**:
- `lib/supabase.ts` cria o client do browser com `createBrowserClient`,
  que escreve a sessão em **cookies** (em vez de localStorage).
- `middleware.ts` mantém a sessão renovada a cada request.
- `lib/supabase-server.ts` lê esses mesmos cookies em todas as API routes
  via `createServerClient`, retornando o usuário sem precisar de header.
- `lib/auth-fetch.ts` agora só repassa `credentials: 'include'`.

Resultado: nenhuma chamada precisa carregar o token manualmente.

## Limites do motor Vercel

- 60s de execução total (suficiente para ~80 MB de assets em conexões boas).
- 80 MB total / 15 MB por asset / 60 assets por tipo (configurável em
  `lib/clone-engine.ts`).
- Sem JS execution (usa fetch puro). Para sites SPA que dependem de JS para
  montar conteúdo, use o motor local.

## Licença

Privado.
