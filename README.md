# marinawoisky.com

Site da artista Marina Woisky. **Astro** gera HTML estático; o conteúdo vem do **Sanity** (painel gratuito); a **Cloudflare Pages** hospeda e reconstrói o site sozinha quando a Marina publica algo no painel. Custo mensal: R$ 0 (só o domínio).

```
Marina (painel Sanity) ──publica──▶ webhook ──▶ Cloudflare Pages reconstrói (~1 min)
                                                         │
Visitante ◀── marinawoisky.com (HTML estático, rápido, bom para o Google)
```

## Estrutura

| Pasta | O que é |
|---|---|
| `src/pages/[...lang]/` | Páginas. Português na raiz, inglês em `/en/` (mesmo arquivo gera as duas). |
| `src/layouts/Base.astro` | Moldura comum: nome no topo, PT/EN, menu no canto inferior esquerdo, SEO. |
| `src/styles/global.css` | Todo o sistema visual (cores, tamanhos, comportamento no celular). |
| `src/lib/content.js` | Busca o conteúdo no Sanity na hora do build (uma consulta GROQ só). |
| `src/lib/opener.js` | Escultura 3D da abertura (three.js). Ajustes do movimento em `CFG`. |
| `src/data/seed.mjs` | Conteúdo inicial. Usado quando o Sanity ainda não está configurado e para a importação. |
| `public/seed/` | Fotos e modelos 3D do conteúdo inicial. |
| `studio/` | O painel (Sanity Studio): tipos de conteúdo em `studio/schemaTypes/`. |
| `scripts/import-seed.mjs` | Sobe o conteúdo inicial para o Sanity (uma vez). |

## Rodar no computador

```bash
npm install
npm run dev          # http://localhost:4321 — sem .env usa o conteúdo inicial
```

Com o Sanity: copie `.env.example` para `.env` e preencha `SANITY_PROJECT_ID`.

Painel local: `cd studio && npm install && SANITY_STUDIO_PROJECT_ID=xxxx npm run dev` (http://localhost:3333).

## Colocar no ar (uma vez)

1. **Sanity.** Crie uma conta em sanity.io e um projeto (plano Free, dataset `production`, público). Anote o *Project ID*.
2. **Painel.** `cd studio && npm install && SANITY_STUDIO_PROJECT_ID=xxxx npx sanity deploy`. O painel fica em `https://marinawoisky.sanity.studio`. Convide a Marina em sanity.io/manage → Members.
3. **Conteúdo inicial.** Em sanity.io/manage → API → Tokens, crie um token *Editor* e rode na raiz:
   `SANITY_PROJECT_ID=xxxx SANITY_WRITE_TOKEN=yyyy npm run import:seed`. Depois apague o token.
4. **Cloudflare Pages.** Workers & Pages → Create → Pages → Connect to Git → este repositório.
   Build command `npm run build` · Output `dist` · Variáveis: `SANITY_PROJECT_ID`, `SANITY_DATASET=production`, `NODE_VERSION=20`.
5. **Publicação automática.** Na Cloudflare: Settings → Builds → Deploy hooks → criar (branch `main`) e copiar o endereço.
   No Sanity: sanity.io/manage → API → Webhooks → Create: URL = o deploy hook, Dataset `production`, Trigger on create/update/delete, Filter vazio, HTTP method POST, sem payload. (O plano Free permite 2 webhooks.)
6. **Testar** no endereço `*.pages.dev` com a Marina.
7. **Domínio.** Cloudflare Pages → Custom domains → `marinawoisky.com` e `www.marinawoisky.com`. Se o domínio tiver e-mail, mantenha os registros MX. Só depois cancelar o Wix (exportando antes imagens e textos).

## Critério de aceite

A Marina cadastra uma obra nova com foto no painel, publica, e em até 2 minutos ela aparece no site; depois consegue editar ou apagar.

## Notas

- Imagens: a Marina sobe a foto original; o CDN do Sanity entrega o tamanho e formato certos para cada tela (`src/lib/img.js`).
- 3D: os modelos `.glb` ficam no próprio Sanity (campo da obra e da abertura). Use arquivos otimizados (até ~3 MB).
- `public/_redirects`: endereços antigos do Wix → novos. Conferir a lista final com o site antigo antes de apontar o domínio.
- Limites gratuitos consultados em nov/2026: Sanity Free (20 usuários, 10 mil documentos, 100 GB de arquivos, 100 GB de banda/mês, 2 webhooks); Cloudflare Pages Free (500 builds/mês, banda ilimitada para arquivos estáticos).
