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
    // endereço principal é www.marinawoisky.com: sem "www" redireciona (mantendo caminho e idioma)
    if (url.hostname === 'marinawoisky.com') {
      url.hostname = 'www.marinawoisky.com';
      return Response.redirect(url.toString(), 301);
    }
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

// Descrição em duas etapas:
// 1) o modelo de visão só OLHA a foto e descreve em inglês o que é visível (sem nenhum contexto, para não inventar);
// 2) o modelo de texto escreve o alt em português juntando essa descrição com o contexto do item.
const LOOK_PROMPT =
  'Describe exactly what is visible in this photo, in 2 or 3 plain sentences. ' +
  'Say what kind of photo it is (an object photographed against a wall, a room with objects, a book or printed pages, a close-up detail, etc.), ' +
  'what the main subject looks like (shapes, figures, animals, text, colours, surfaces) and its viewpoint (front, side, angle, from above). ' +
  'If there is readable large text, quote it. Do not guess anything you cannot see.';

function contextLine(ctx) {
  const c = (v) => String(v || '').trim().slice(0, 200);
  const title = c(ctx.title), year = c(ctx.year);
  if (ctx.kind === 'artwork') return `Item: obra de arte "${title}"${year ? ` (${year})` : ''} de Marina Woisky${ctx.technique ? `; técnica: ${c(ctx.technique)}` : ''}. Formato: "[tipo de vista] de ${title}${year ? ` (${year})` : ''}, de Marina Woisky: [o que se vê]".`;
  if (ctx.kind === 'exhibition') return `Item: exposição "${title}"${year ? ` (${year})` : ''}${ctx.venue ? `, em ${c(ctx.venue)}` : ''}, com obras de Marina Woisky. Formato: "Vista da exposição ${title}${ctx.venue ? ` em ${c(ctx.venue)}` : ''}: [o que se vê]".`;
  if (ctx.kind === 'publication') return `Item: publicação "${title}"${ctx.outlet ? ` (${c(ctx.outlet)})` : ''}${year ? `, ${year}` : ''}, em que Marina Woisky aparece. Formato: "[Capa / Páginas / Exemplar] de ${title}: [o que se vê]".`;
  return `Item: imagem do site da artista Marina Woisky${title ? ` ("${title}")` : ''}.`;
}

async function describe(env, src, ctx = {}) {
  if (!/^https:\/\/cdn\.sanity\.io\/images\//.test(src || '')) throw new Error('Imagem inválida.');
  const img = await fetch(`${src}?w=768&fm=jpg&q=80`);
  if (!img.ok) throw new Error('Não consegui abrir a imagem.');
  const bytes = new Uint8Array(await img.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const image = `data:image/jpeg;base64,${btoa(bin)}`;

  // 1) olhar
  const look = {
    messages: [
      { role: 'system', content: 'You are a careful, literal describer of photographs.' },
      { role: 'user', content: LOOK_PROMPT },
    ],
    image,
    max_tokens: 200,
    temperature: 0,
  };
  let seen;
  try {
    seen = await env.AI.run(VISION_MODEL, look);
  } catch (e) {
    // Na primeira vez a Cloudflare pede para aceitar a licença do modelo da Meta.
    if (!/agree|license/i.test(String(e?.message || e))) throw e;
    await env.AI.run(VISION_MODEL, { prompt: 'agree' });
    seen = await env.AI.run(VISION_MODEL, look);
  }
  const visual = String(seen.response || '').trim();
  if (!visual) throw new Error('A IA não conseguiu ler a foto. Tente de novo.');

  // 2) escrever
  const out = await env.AI.run(TEXT_MODEL, {
    messages: [
      {
        role: 'system',
        content:
          'Você escreve textos alternativos (alt text) em português do Brasil para o site da artista Marina Woisky. ' +
          'Use SOMENTE o que está na descrição visual para dizer o que aparece na foto; o contexto serve só para nomear o item. ' +
          'Não invente materiais, bichos ou cores que a descrição visual não menciona. Se for uma obra, pode usar os materiais da técnica para nomear superfícies que a descrição mostra. ' +
          'Uma frase, no máximo 30 palavras, sem aspas, sem "imagem de"/"foto de", sem interpretar ou elogiar. Responda só com a frase.',
      },
      { role: 'user', content: `${contextLine(ctx)}\n\nDescrição visual (em inglês, feita por quem viu a foto):\n${visual}` },
    ],
    max_tokens: 120,
    temperature: 0.2,
  });
  return String(out.response || '').trim().replace(/^["“]|["”]$/g, '').replace(/\s+/g, ' ');
}
