# VSL Cloner — Motor Local v2

Motor de clonagem que roda no seu próprio computador para capturar **funis VSL complexos** que servidores serverless (Vercel, Cloudflare Workers) não conseguem clonar dentro do limite de 60s ou que são bloqueados por proteções como Cloudflare Bot Management.

Diferente de scrapers tradicionais, este motor abre um **Chrome real via Puppeteer** dentro do contexto do navegador, navega o quiz para forçar o carregamento de chunks lazy do Webpack, e baixa **todos** os assets condicionais (áudios mapeados por respostas, animações Lottie, legendas VTT, segmentos m3u8) usando o próprio `fetch` do navegador — o que automaticamente passa pela proteção Cloudflare.

## O que ele clona

| Categoria | Exemplo capturado |
|---|---|
| HTML principal | `index.html` (já com paths reescritos e router em modo hash) |
| CSS | `css/astrologyStyle.css`, `css/351.108988b0.css` |
| Chunks Webpack | `js/chunk-vendors.*.js`, `js/app.*.js`, `js/351.*.js`, `js/411.*.js` |
| Imagens | PNG, JPG, SVG, WebP, GIF |
| Fontes | woff/woff2 (Google Fonts) |
| Áudios condicionais | `audio/p1/v2/{1..22}.mp3`, `audio/p2/v2/{felicidade,saude,dinheiro,h_casado,m_casada,h_solteiro,m_solteira,...}.mp3` |
| Animações Lottie | `animations/p1v2/*.json`, `animations/p2v2/*.json` |
| Legendas VTT | `legends/p1/v2/*.vtt`, `legends/p2/v2/*.vtt` |
| Player VSL | VTurb / ConverteAI (m3u8 público mantido) |
| Empacotamento | `clone.zip` standalone para qualquer servidor estático |

## Pré-requisitos

* Node.js 18 ou superior
* `pnpm`, `npm` ou `yarn`
* ~1 GB livres no disco (o Chromium do Puppeteer ocupa ~170 MB)

## Instalação (única vez)

```bash
cd local-engine
npm install
```

A primeira execução baixa um Chromium completo automaticamente.

## Uso

### Clonar com um único comando

```bash
npx tsx clone.ts https://testexamanico.misteriosdaalma.com/v2
```

Em **3 a 5 minutos** você terá:

```
out/<host>/
├── index.html             ← já com paths reescritos e router em hash
├── assets/                ← assets externos (CDN, fontes, players)
├── audio/p1/v2/*.mp3      ← áudios condicionais por numerologia
├── audio/p2/v2/*.mp3      ← áudios condicionais por gênero/estado civil/desafio
├── animations/p*v2/*.json ← Lottie
├── legends/p*/v2/*.vtt    ← legendas sincronizadas
├── css/, js/, img/, media/
├── clone.zip              ← pacote completo para deploy
├── clone-manifest.json    ← inventário de tudo que foi capturado
└── README.txt             ← instruções de uso do pacote
```

Depois disso, um servidor estático sobe automaticamente em **http://localhost:8080** e (quando possível) o navegador é aberto para preview.

### Flags

| Flag | Descrição | Padrão |
|---|---|---|
| `--out=<pasta>` | Pasta de saída | `out/<hostname>` |
| `--port=<n>` | Porta do servidor de preview | `8080` |
| `--no-preview` | Não sobe o servidor local após clonar | (desligado) |

Exemplos:

```bash
# Saída customizada
npx tsx clone.ts https://exemplo.com/funil --out=clones/funil-amor

# Apenas gerar ZIP, sem abrir preview
npx tsx clone.ts https://exemplo.com/funil --no-preview

# Mudar porta do preview
npx tsx clone.ts https://exemplo.com/funil --port=9000
```

### Como o preview funciona

O servidor embutido usa **fallback SPA**: qualquer rota desconhecida cai para `index.html`. Combinado com o Vue Router no modo hash (`/#/v2`, `/#/g-ass`, etc.), o clone funciona em qualquer servidor estático sem precisar de regras de rewrite.

## Como ele fura o Cloudflare

1. **User-Agent realista** + cabeçalhos `Accept-Language`.
2. **Navegação real** (`puppeteer.launch` com `--disable-blink-features=AutomationControlled`) que executa o JS challenge da Cloudflare.
3. **Downloads dos assets condicionais** são feitos por **`page.evaluate(fetch)`**, ou seja, do mesmo contexto da página, com cookies de sessão e Referer corretos. Cloudflare aceita esses requests porque parecem vir do próprio funil.

## Bugs corrigidos automaticamente

| Bug original do funil | Correção aplicada |
|---|---|
| `getJsonData(t)` faz `fetch(\`/${t}/\`)` (barra extra ao final) → 403 | `fetch` global é envelopado e remove `/` final após extensão. Além disso, o JS do chunk é patchado em build-time para usar `fetch(t)` diretamente. |
| Vue Router em `mode:"history"` quebra em `file://` ou em hosts sem rewrite | Convertido automaticamente para `mode:"hash"` e injetado redirecionamento `/v2` → `/#/v2` para todas as rotas conhecidas. |
| Webpack `publicPath: "/"` quebra quando hospedado em subpasta | `publicPath` reescrito para `""` (relativo). |
| Barras duplicadas em paths concatenados (`/audio//8.mp3`) | Sanitizadas via fetch wrapper. |
| Scripts de analytics (GTM, GA, Facebook Pixel, Utmify) tentam fazer requests externos e poluem o clone | Removidos do HTML e substituídos por stubs `fbq`/`gtag` no-op. |
| Nomes ofuscados via SHA-256 (em outros funis) | O wrapper de `fetch` mantém o request original; ofuscação é resolvida pelo browser via `crypto.subtle` exatamente como em produção. |

## Integração com o dashboard Next.js

O motor pode ser usado diretamente pela interface web do projeto (em `app/local-clone`). O backend expõe quatro rotas:

| Rota | Método | O que faz |
|---|---|---|
| `/api/local-clone/start` | POST | Cria um job, retorna `jobId` e URLs de stream/preview/download |
| `/api/local-clone/stream/[jobId]` | GET (SSE) | Empurra eventos de progresso (`log`, `phase`, `asset`, `group`, `done`, `error`) em tempo real |
| `/api/local-clone/preview/[jobId]/[...path]` | GET | Servidor estático do clone com fallback SPA — use direto em iframe |
| `/api/local-clone/download/[jobId]` | GET | Devolve o `clone.zip` |
| `/api/local-clone/jobs` | GET | Lista os jobs em memória (status, totais, erros) |

Fluxo do usuário em `localhost:3000`:

1. Faz login → abre `/local-clone` (ou clica em **Motor Local** no dashboard).
2. Cola a URL do funil → clica em **Clonar**.
3. Vê barra de progresso, contadores e log do motor empurrados via SSE.
4. Ao terminar: iframe com o clone funcional + botão **Baixar ZIP**.

### Variaveis de ambiente úteis (somente dev local)

| Variável | Efeito |
|---|---|
| `LOCAL_CLONE_NO_AUTH=1` | Pula a autenticação nas rotas API. Use só em `next dev`, nunca em produção. |
| `NEXT_PUBLIC_LOCAL_CLONE_NO_AUTH=1` | Pula o gate de login na página `/local-clone`. Idem. |

### Por que não funciona na Vercel?

A rota usa Puppeteer (Chrome real, ~170 MB) e dura 1–5 minutos por clone. Vercel e similares têm timeout de 60s por request e não suportam binaríos nativos do Chromium. O motor existe justamente para resolver isso: roda no PC do usuário sem limite, e o resultado pode ser hospedado em qualquer lugar.

## Subir para o painel SaaS (Supabase)

Compatível com o motor anterior — o pacote `clone.zip` segue o mesmo formato.

```bash
node clone-local.mjs <URL> <projectId> --upload \
  --supabase-url=https://oishenwcfeyucmtmysaa.supabase.co \
  --supabase-anon-key=<NEXT_PUBLIC_SUPABASE_ANON_KEY> \
  --user-token=<seu-access_token-do-supabase>
```

## Versão legada

O motor original em JavaScript puro continua disponível como `clone-local.mjs` para quem precisa só de uma captura simples sem detecção de quiz/áudios condicionais:

```bash
node clone-local.mjs <URL>
```

## Limites configuráveis

Edite o início de `clone.ts` para alterar:

* `timeout` total de navegação (default 90 s)
* delay extra após `networkidle2` (default 4 s)
* limite por asset (default 80 MB)
* lista de variantes de p2 (`felicidade`, `saude`, `dinheiro`, etc.)
