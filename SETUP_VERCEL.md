# VSL Cloner — Guia de Setup e Deploy na Vercel

## 📋 Pré-requisitos

- ✅ Supabase project criado: `https://oishenwcfeyucmtmysaa.supabase.co`
- ✅ Tabelas e RLS já configuradas no Supabase
- ✅ Código enviado para `royalmaxDR/Next-Enterprise` no GitHub
- ✅ Conta Vercel criada

---

## 🚀 Deploy na Vercel (3 passos)

### Passo 1: Conectar repositório na Vercel

1. Acesse https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Procure por `royalmaxDR/Next-Enterprise` e selecione
4. Clique em **"Import"**

### Passo 2: Configurar variáveis de ambiente

Na tela de configuração do projeto, vá para **"Environment Variables"** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://oishenwcfeyucmtmysaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pc2hlbndjZmV5dWNtdG15c2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODU0MjUsImV4cCI6MjA5MzE2MTQyNX0.mLWpztGMCW8rGWEUeoHVmCOaBx0g-8sFiPu9wlBlIjw
SUPABASE_SERVICE_ROLE_KEY=[SUA_SERVICE_ROLE_KEY_AQUI]
NEXT_PUBLIC_APP_URL=[SERÁ_PREENCHIDO_APÓS_DEPLOY]
```

**Importante:** Substitua `[SUA_SERVICE_ROLE_KEY_AQUI]` pela sua service role key do Supabase (encontrada em Project Settings → API → Service Role Key).

### Passo 3: Deploy

1. Clique em **"Deploy"**
2. Aguarde ~2-3 minutos
3. Após sucesso, você receberá uma URL como `https://next-enterprise-xxx.vercel.app`

---

## ✅ Após o Deploy

### Atualizar NEXT_PUBLIC_APP_URL

1. Volte às **Settings** do projeto na Vercel
2. Vá para **"Environment Variables"**
3. Edite `NEXT_PUBLIC_APP_URL` e defina como a URL do seu deploy (ex: `https://next-enterprise-xxx.vercel.app`)
4. Clique em **"Save"**
5. Redeploy: vá para **"Deployments"** → clique nos 3 pontos do último deploy → **"Redeploy"**

---

## 🧪 Testando o SaaS

### 1. Acessar a aplicação
- URL: `https://next-enterprise-xxx.vercel.app`
- Você verá a landing page com opções de **Entrar** ou **Começar grátis**

### 2. Criar conta
- Clique em **"Começar grátis"**
- Preencha email e senha
- Confirme o email (se necessário)

### 3. Criar primeiro projeto
- No dashboard, clique em **"Novo Projeto"**
- Cole a URL de uma página VSL (ex: `https://4w1u5s3w.xquiz.io/`)
- Clique em **"Criar e Extrair"**
- Aguarde a extração (pode levar 10-30 segundos)

### 4. Editar funil
- Após extração, você será levado ao editor
- Veja os ativos extraídos (player, pixels, checkout, etc.)
- Edite:
  - **Link de Checkout** — substitua pelo seu link
  - **Facebook Pixel ID** — substitua pelo seu ID
  - **Textos** — customize headline, subheadline, botão CTA
- Clique em **"Salvar alterações"**

### 5. Publicar
- Clique em **"Publicar Funil"**
- Você receberá uma URL pública (ex: `https://next-enterprise-xxx.vercel.app/p/funil-produto-x-abc123`)
- Copie e compartilhe!

---

## 🔧 Troubleshooting

### Erro: "Não autorizado" ao acessar dashboard
- Verifique se você fez login com sucesso
- Limpe cookies do navegador e tente novamente

### Erro: "Falha na extração"
- Verifique se a URL é válida e acessível
- Certifique-se de que a página tem um player suportado (ConvertAI, VTurb, SmartPlayer)
- Tente novamente após alguns segundos

### Erro: "Variáveis de ambiente não configuradas"
- Verifique se todas as 4 variáveis estão configuradas na Vercel
- Redeploy o projeto após adicionar variáveis

### Página publicada não carrega o vídeo
- Verifique se o player original ainda está acessível
- Alguns players podem ter restrições de CORS ou autenticação

---

## 📚 Estrutura do Projeto

```
app/
├── page.tsx              # Landing page
├── login/page.tsx        # Login
├── signup/page.tsx       # Cadastro
├── dashboard/page.tsx    # Dashboard (protegido)
├── editor/[id]/page.tsx  # Editor de funil (protegido)
├── p/[slug]/page.tsx     # Página publicada (pública)
└── api/
    ├── extract/route.ts  # POST /api/extract
    ├── projects/route.ts # GET/POST /api/projects
    ├── projects/[id]/route.ts  # GET/PUT/DELETE /api/projects/[id]
    └── publish/route.ts  # POST /api/publish

lib/
├── supabase.ts           # Cliente Supabase (browser)
├── supabase-server.ts    # Cliente Supabase (server)
├── extractor.ts          # Motor de extração
└── utils.ts              # Utilitários

components/
├── StatusBadge.tsx       # Badge de status
├── NewProjectModal.tsx   # Modal de novo projeto
└── PublishedPageRenderer.tsx  # Renderizador da página publicada
```

---

## 🔐 Segurança

- ✅ Autenticação via Supabase Auth (email + senha)
- ✅ Middleware Next.js protege rotas `/dashboard` e `/editor`
- ✅ Row Level Security (RLS) no Supabase garante que usuários veem apenas seus dados
- ✅ Páginas publicadas são públicas apenas com status='publicado'
- ✅ Service role key é secreta (nunca exposta no frontend)

---

## 📞 Suporte

Para dúvidas sobre:
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **Next.js**: https://nextjs.org/docs

---

**Status:** ✅ Pronto para deploy
**Última atualização:** 2026-05-01
