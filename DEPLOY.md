# Guia de Deploy e Configuração (Vercel + Supabase)

Este guia explica como configurar o ambiente para produção.

## 1. Configuração do Supabase

1.  Crie um projeto no [Supabase](https://supabase.com/).
2.  Vá para o **SQL Editor** no painel do Supabase.
3.  Copie o conteúdo do arquivo `supabase/schema.sql` deste projeto.
4.  Cole no SQL Editor e execute (Run). Isso criará todas as tabelas e políticas de segurança necessárias.

## 2. Variáveis de Ambiente

Você precisa configurar as seguintes variáveis de ambiente no seu projeto local (`.env.local`) e na Vercel.

```env
NEXT_PUBLIC_SUPABASE_URL=Sua_URL_do_Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=Sua_Chave_Anonima_do_Supabase
```

Para encontrar essas chaves no Supabase:
-   Vá em **Project Settings** > **API**.

## 3. Deploy na Vercel

1.  Crie uma conta na [Vercel](https://vercel.com/).
2.  Importe o repositório do GitHub.
3.  Na configuração do projeto, adicione as variáveis de ambiente acima (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4.  Clique em **Deploy**.

## 4. Populando o Banco de Dados (Jobs)

O arquivo `supabase/schema.sql` cria a estrutura, mas o banco começa vazio de vagas.
Para popular com as 1000 vagas geradas, você pode criar um script de seed ou inserir manualmente via SQL Editor.

Exemplo de inserção manual (SQL):
```sql
INSERT INTO public.jobs (id, category, type, company, title, value, duration, description)
VALUES ('JOB-TEST-001', 'Iniciante', 'ad', 'TikTok', 'Teste', 50.00, '15 min', 'Descrição...');
```

Para produção real, recomenda-se criar um script Node.js que leia o `data/jobs.ts` e insira no Supabase usando a biblioteca `@supabase/supabase-js`.
