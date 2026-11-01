// Worker do site: entrega os arquivos estáticos (dist/) e duas rotas de ajuda para o painel do Sanity,
// usando o Workers AI da própria Cloudflare (plano gratuito: 10 mil "neurons"/dia, bem mais que o uso previsto).
//   POST /api/translate  { texts: ["...", ...] }  → { texts: ["...", ...] }   (português → inglês)
//   POST /api/describe   { url: "https://cdn.sanity.io/images/..." } → { alt: "..." }
const ALLOWED = [/^https:\/\/marinawoisky\.sanity\.studio$/, /^http:\/\/localhost:3333$/];
const TEXT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

const cors = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  Vary: 'Origin',
});
const json = (data, origin, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    const origin = request.headers.get('Origin') || '';
    if (!ALLOWED.some((re) => re.test(origin))) return new Response('Forbidden', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
    if (request.method !== 'POST') return json({ error: 'POST only' }, origin, 405);

    try {
      const body = await request.json();
      if (url.pathname === '/api/translate') return json({ texts: await translate(env, body.texts) }, origin);
      if (url.pathname === '/api/describe') return json({ alt: await describe(env, body.url, body.context || {}) }, origin);
      return json({ error: 'not found' }, origin, 404);
    } catch (e) {
      return json({ error: String(e?.message || e) }, origin, 500);
    }
  },
};

const SYSTEM_TR =
  'You are a professional art-world translator. Translate every item from Brazilian Portuguese into fluent English for a contemporary artist\'s website. ' +
  'The output must be entirely in English: no Portuguese words may remain, except proper names (people, venues, galleries, cities) and artwork or exhibition titles written in quotes. ' +
  'Glossary: "argamassa" = "mortar"; "cimento" = "cement"; "concreto" = "concrete"; "gesso" = "plaster"; "pelúcia" = "plush"; "exposição individual" = "solo exhibition"; "exposição coletiva" = "group exhibition"; "impressão" = "print"; "tecido" = "fabric". ' +
  'Keep numbers, units and punctuation. Input: a JSON array of strings. Output: ONLY a JSON array of strings, same length, same order, nothing else.';
const EXAMPLE_IN = ['Impressão sobre tecido, argamassa pigmentada e ferro', 'Exposição coletiva com curadoria de Ana Paula Lopes', 'Vive e trabalha em São Paulo.'];
const EXAMPLE_OUT = ['Print on fabric, pigmented mortar and iron', 'Group exhibition curated by Ana Paula Lopes', 'Lives and works in São Paulo.'];

async function translate(env, texts) {
  if (!Array.isArray(texts) || !texts.length) return [];
  if (texts.length > 200 || JSON.stringify(texts).length > 40000) throw new Error('Texto longo demais para uma vez só.');
  // trechos vazios ou só espaço não vão para o modelo
  const idx = texts.map((t, i) => (String(t).trim() ? i : -1)).filter((i) => i >= 0);
  const result = texts.map(String);
  if (!idx.length) return result;
  const src = idx.map((i) => texts[i]);
  for (let attempt = 0; attempt < 2; attempt++) {
    const out = await env.AI.run(TEXT_MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_TR },
        { role: 'user', content: JSON.stringify(EXAMPLE_IN) },
        { role: 'assistant', content: JSON.stringify(EXAMPLE_OUT) },
        { role: 'user', content: JSON.stringify(src) },
      ],
      max_tokens: 8000,
      temperature: 0,
    });
    const raw = typeof out.response === 'string' ? out.response : JSON.stringify(out.response);
    let arr;
    try { arr = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1)); } catch { continue; }
    if (!Array.isArray(arr) || arr.length !== src.length) continue;
    // se algum trecho com várias palavras voltou igual ao original, tenta de novo
    const untouched = arr.some((t, k) => String(t).trim() === src[k].trim() && src[k].trim().split(/\s+/).length > 2);
    if (untouched && attempt === 0) continue;
    idx.forEach((i, k) => {
      // preserva espaços no começo/fim (importante entre trechos em itálico e normais)
      const lead = texts[i].match(/^\s*/)[0], trail = texts[i].match(/\s*$/)[0];
      result[i] = lead + String(arr[k]).trim() + trail;
    });
    return result;
  }
  throw new Error('A tradução falhou. Tente de novo em alguns segundos.');
}

// Monta a instrução com o contexto do item (obra, exposição ou publicação)
function altPrompt(ctx) {
  const clean = (v) => String(v || '').trim().slice(0, 200);
  const title = clean(ctx.title), year = clean(ctx.year), tech = clean(ctx.technique), place = clean(ctx.venue), outlet = clean(ctx.outlet);
  const base =
    'Você escreve textos alternativos (alt text) para o site da artista brasileira Marina Woisky. ' +
    'Ela faz relevos e esculturas a partir de imagens impressas em tecido, preenchidas com argamassa, cimento, resina, gesso etc.: bichos e ornamentos distorcidos, entre o plano e o volume. ' +
    'Escreva UMA frase em português do Brasil, com no máximo 30 palavras, sem aspas, sem "imagem de" ou "foto de". ' +
    'Diga primeiro que vista é (frontal, lateral, detalhe, vista de cima, vista da instalação, obra na parede), depois o que se vê: bichos ou formas, cores, textura, como a obra ocupa o espaço. ' +
    'Não interprete nem elogie; descreva.';
  if (ctx.kind === 'exhibition')
    return base + ` A foto é da exposição "${title}"${year ? ` (${year})` : ''}${place ? `, em ${place}` : ''}. Comece com "Vista da exposição ${title}${place ? ` em ${place}` : ''}," e diga quais obras ou objetos aparecem e como estão dispostos.`;
  if (ctx.kind === 'publication')
    return base + ` A foto é de uma publicação: "${title}"${outlet ? ` (${outlet})` : ''}${year ? `, ${year}` : ''}. Comece com "Páginas de ${title}," e diga o que aparece nas páginas (obras reproduzidas, texto, layout).`;
  if (ctx.kind === 'artwork' && title)
    return base + ` A foto é da obra "${title}"${year ? ` (${year})` : ''}${tech ? `, técnica: ${tech}` : ''}. ` +
      `Comece assim: "[Tipo de vista] de ${title}${year ? ` (${year})` : ''}, de Marina Woisky:" e em seguida descreva o que se vê, usando os materiais da técnica quando fizer sentido (ex.: superfície de argamassa, tecido impresso, brilho da resina).`;
  return base;
}

async function describe(env, src, ctx = {}) {
  if (!/^https:\/\/cdn\.sanity\.io\/images\//.test(src || '')) throw new Error('Imagem inválida.');
  const img = await fetch(`${src}?w=768&fm=jpg&q=80`);
  if (!img.ok) throw new Error('Não consegui abrir a imagem.');
  const bytes = new Uint8Array(await img.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const image = `data:image/jpeg;base64,${btoa(bin)}`;
  const input = {
    messages: [
      { role: 'system', content: altPrompt(ctx) },
      { role: 'user', content: 'Escreva o texto alternativo desta foto.' },
    ],
    image,
    max_tokens: 160,
    temperature: 0.2,
  };
  let out;
  try {
    out = await env.AI.run(VISION_MODEL, input);
  } catch (e) {
    // Na primeira vez a Cloudflare pede para aceitar a licença do modelo da Meta.
    if (!/agree|license/i.test(String(e?.message || e))) throw e;
    await env.AI.run(VISION_MODEL, { prompt: 'agree' });
    out = await env.AI.run(VISION_MODEL, input);
  }
  return String(out.response || '').trim().replace(/^["“]|["”]$/g, '').replace(/\s+/g, ' ');
}
