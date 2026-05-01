# VSL Cloner — Motor Local (Puppeteer Full)

Para sites com proteção pesada (Cloudflare, JS Challenge, SPAs com lazy-loading
agressivo), a Vercel não consegue clonar tudo dentro do limite de 60s.
Este motor roda no seu computador, usa o **Puppeteer completo** (com Chromium
real), captura **todas** as respostas HTTP da página renderizada e gera
um pacote ZIP standalone.

## Instalação (única vez)

```bash
cd local-engine
npm install
```

A primeira execução baixa um Chromium (~170 MB) na pasta `node_modules`.

## Uso básico

```bash
node clone-local.mjs https://exemplo.com/funil
```

Saída padrão: `out/<host>/` com `index.html`, `assets/...`, `clone.zip`,
`clone-manifest.json` e `README.txt`.

Para escolher outra pasta:

```bash
node clone-local.mjs https://exemplo.com/funil minhas-clonagens/funil-x
```

Para testar localmente o resultado:

```bash
cd out/exemplo.com
npx http-server -c-1
# abrir http://localhost:8080
```

## Enviar direto para o painel SaaS

Você pode publicar o clone no seu painel sem precisar fazer upload manual.
Pegue do navegador (DevTools → Application → Cookies do seu domínio) o
`access_token` da sessão Supabase.

```bash
node clone-local.mjs https://exemplo.com/funil out/exemplo \
  --upload \
  --project-id=<UUID-do-projeto> \
  --supabase-url=https://oishenwcfeyucmtmysaa.supabase.co \
  --supabase-anon-key=<NEXT_PUBLIC_SUPABASE_ANON_KEY> \
  --user-token=<seu-access_token-do-supabase>
```

O motor faz upload de todos os arquivos para o bucket `clones` no caminho
`users/<userId>/projects/<projectId>/...`. Depois disso, o painel mostra
o preview funcional e o link de download do ZIP automaticamente.

## Por que rodar local?

- Sites com **Cloudflare** ou **JS Challenge** raramente passam por um
  fetch direto a partir de uma função serverless.
- SPAs (React/Vue/Svelte) só montam o DOM completo após `networkidle`.
- Funções serverless têm limite de tempo (60s na Vercel) e tamanho.
- No seu PC, você tem CPU, rede e tempo livres — clones pesados
  funcionam sem corte.

## Limites configuráveis

Edite o início de `clone-local.mjs` para alterar:

- timeout total de navegação (default 60s)
- delay extra após `networkidle2` (default 3.5s — ajuda players VSL)
- limite por asset (default 30 MB)
