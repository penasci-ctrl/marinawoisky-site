// Busca todo o conteúdo do site na hora do build.
// Com SANITY_PROJECT_ID definido, lê do Sanity; sem ele, usa o conteúdo inicial (src/data/seed.mjs),
// o que permite rodar e testar o site sem conta nenhuma.
import { createClient } from '@sanity/client';
import { docs as seedDocs } from '../data/seed.mjs';

const projectId = (import.meta.env.USE_SEED || process.env.USE_SEED) ? '' : (import.meta.env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'wqz875em');
const dataset = import.meta.env.SANITY_DATASET || process.env.SANITY_DATASET || 'production';

const IMG = `{ "src": asset->url, "w": asset->metadata.dimensions.width, "h": asset->metadata.dimensions.height, alt, caption }`;
const EXH_REF = `{ "slug": slug.current, title, year, showInCvOnly }`;

const QUERY = `{
  "works": *[_type == "artwork" && hidden != true] | order(year desc, order asc, _createdAt desc) {
    "id": _id, "slug": slug.current, title, year, technique, dimensions, photoCredit,
    "images": images[] ${IMG},
    "exhibitions": exhibitions[]-> ${EXH_REF}
  },
  "exhibitions": *[_type == "exhibition"] | order(year desc, coalesce(order, 999) asc, startDate desc, _createdAt desc) {
    "id": _id, "slug": slug.current, title, kind, year, venue, city, note, startDate, endDate,
    photoCredit, text, textAuthor, link, showInCvOnly,
    "images": images[] ${IMG},
    "works": *[_type == "artwork" && hidden != true && references(^._id)] | order(year desc, order asc) { "slug": slug.current, title, year }
  },
  "publications": *[_type == "publication"] | order(year desc, _createdAt desc) {
    "id": _id, title, category, outlet, year, link, "pdf": pdf.asset->url, "images": images[] ${IMG}
  },
  "texts": *[_type == "essay"] | order(year desc, _createdAt desc) {
    "id": _id, title, kind, author, year, context, body, link
  },
  "about": *[_id == "about"][0] {
    bio, cv, "portrait": portrait ${IMG}, portraitCredit, "cvPdf": cvPdf.asset->url
  },
  "settings": *[_id == "settings"][0] {
    email, instagram, newsletter, galleries, description,
    "shareImage": shareImage ${IMG},
    "opening": {
      "web": openingModel.asset->url,
      "mobile": coalesce(openingModelMobile.asset->url, openingModel.asset->url),
      "work": openingArtwork-> { "slug": slug.current, title, year }
    }
  }
}`;

// ------------------------------------------------------------ conteúdo inicial (sem Sanity)
function fromSeed() {
  const byId = Object.fromEntries(seedDocs.map((d) => [d._id, d]));
  const im = (i) => i && { src: `/seed/${i._seed}`, w: i.w, h: i.h, alt: i.alt, caption: i.caption };
  const ims = (a) => (a || []).map(im);
  const of = (t) => seedDocs.filter((d) => d._type === t);
  const s = (d) => d.slug?.current;

  const works = of('artwork')
    .filter((d) => !d.hidden)
    .sort((a, b) => b.year - a.year || (a.order ?? 99) - (b.order ?? 99))
    .map((d) => ({
      id: d._id, slug: s(d), title: d.title, year: d.year, technique: d.technique, dimensions: d.dimensions, photoCredit: d.photoCredit,
      images: ims(d.images),
      exhibitions: (d.exhibitions || []).map((r) => byId[r._ref]).filter(Boolean).map((e) => ({ slug: s(e), title: e.title, year: e.year, showInCvOnly: e.showInCvOnly })),
    }));
  const exhibitions = of('exhibition')
    .sort((a, b) => b.year - a.year)
    .map((d) => ({
      id: d._id, slug: s(d), title: d.title, kind: d.kind, year: d.year, venue: d.venue, city: d.city, note: d.note,
      startDate: d.startDate, endDate: d.endDate, photoCredit: d.photoCredit, text: d.text, textAuthor: d.textAuthor, link: d.link,
      showInCvOnly: d.showInCvOnly, images: ims(d.images),
      works: of('artwork').filter((w) => (w.exhibitions || []).some((r) => r._ref === d._id)).map((w) => ({ slug: s(w), title: w.title, year: w.year })),
    }));
  const publications = of('publication').sort((a, b) => b.year - a.year).map((d) => ({ id: d._id, title: d.title, category: d.category, outlet: d.outlet, year: d.year, link: d.link, images: ims(d.images) }));
  const texts = of('essay').sort((a, b) => b.year - a.year).map((d) => ({ id: d._id, title: d.title, kind: d.kind, author: d.author, year: d.year, context: d.context, body: d.body, link: d.link }));
  const a = byId.about;
  const st = byId.settings;
  return {
    works, exhibitions, publications, texts,
    about: { bio: a.bio, cv: a.cv, portrait: im(a.portrait), portraitCredit: a.portraitCredit },
    settings: {
      email: st.email, instagram: st.instagram, newsletter: st.newsletter, galleries: st.galleries, description: st.description,
      opening: { web: `/seed/${st._seedOpening.web}`, mobile: `/seed/${st._seedOpening.mobile}`, work: null },
    },
  };
}

let cache;
export async function getContent() {
  if (cache) return cache;
  if (!projectId) {
    cache = fromSeed();
  } else {
    const client = createClient({ projectId, dataset, apiVersion: '2025-01-01', useCdn: false, perspective: 'published' });
    const data = await client.fetch(QUERY);
    data.about ||= { bio: null, cv: [] };
    data.settings ||= { opening: {} };
    for (const k of ['works', 'exhibitions', 'publications', 'texts']) {
      data[k] = (data[k] || []).map((d) => ({ ...d, images: (d.images || []).filter((i) => i && i.src) }));
    }
    cache = data;
  }
  return cache;
}
