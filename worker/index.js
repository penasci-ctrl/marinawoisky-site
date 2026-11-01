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
      if (url.pathname === '/api/describe') return json({ alt: await describe(env, body.url) }, origin);
      return json({ error: 'not found' }, origin, 404);
    } catch (e) {
      return json({ error: String(e?.message || e) }, origin, 500);
    }
  },
};

async function translate(env, texts) {
  if (!Array.isArray(texts) || !texts.length) return [];
  if (texts.length > 200 || JSON.stringify(texts).length > 40000) throw new Error('Texto longo demais para uma vez só.');
  const out = await env.AI.run(TEXT_MODEL, {
    messages: [
      {
        role: 'system',
        content:
          'You translate Brazilian Portuguese into natural, elegant English for a contemporary artist\'s website (art-world register). ' +
          'Translate "argamassa" as "cement". Keep proper names, exhibition titles in quotes, venue names and numbers as they are. ' +
          'Keep leading/trailing spaces of each item. You receive a JSON array of strings; reply ONLY with a JSON array of the same length, same order.',
      },
      { role: 'user', content: JSON.stringify(texts) },
    ],
    max_tokens: 8000,
    temperature: 0.2,
  });
  const raw = typeof out.response === 'string' ? out.response : JSON.stringify(out.response);
  const arr = JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1));
  if (!Array.isArray(arr) || arr.length !== texts.length) throw new Error('A tradução voltou incompleta. Tente de novo.');
  return arr.map(String);
}

async function describe(env, src) {
  if (!/^https:\/\/cdn\.sanity\.io\/images\//.test(src || '')) throw new Error('Imagem inválida.');
  const img = await fetch(`${src}?w=768&fm=jpg&q=80`);
  if (!img.ok) throw new Error('Não consegui abrir a imagem.');
  const bytes = new Uint8Array(await img.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const image = `data:image/jpeg;base64,${btoa(bin)}`;
  const input = {
    messages: [
      {
        role: 'system',
        content:
          'You write alt text for photos of artworks and exhibitions on an artist\'s website. ' +
          'One sentence in Brazilian Portuguese, at most 25 words, describing what is visible: form, material appearance, colours, setting. ' +
          'No interpretation, no "imagem de", no quotes.',
      },
      { role: 'user', content: 'Descreva esta imagem.' },
    ],
    image,
    max_tokens: 120,
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
  return String(out.response || '').trim().replace(/^["“]|["”]$/g, '');
}
