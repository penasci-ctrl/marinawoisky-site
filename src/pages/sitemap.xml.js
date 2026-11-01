// sitemap.xml gerado a partir do conteúdo (PT e EN)
import { getContent } from '../lib/content.js';
import { href } from '../lib/i18n.js';

export async function GET({ site }) {
  const { works, exhibitions } = await getContent();
  const paths = ['/', '/obras', '/exposicoes', '/publicacoes', '/textos', '/sobre',
    ...works.map((w) => `/obras/${w.slug}`),
    ...exhibitions.filter((e) => !e.showInCvOnly).map((e) => `/exposicoes/${e.slug}`)];
  const urls = paths.flatMap((p) => ['pt', 'en'].map((l) => new URL(href(l, p), site).href));
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
