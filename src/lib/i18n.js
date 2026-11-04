import { toHTML } from '@portabletext/to-html';

export const LANGS = ['pt', 'en'];

// Rotas: português na raiz, inglês em /en/
export const langPaths = () => [{ params: { lang: undefined }, props: { lang: 'pt' } }, { params: { lang: 'en' }, props: { lang: 'en' } }];

export const href = (lang, path = '/') => {
  const clean = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}/`;
  return lang === 'en' ? (clean === '/' ? '/en/' : `/en${clean}`) : clean;
};

// Campo bilíngue: mostra o inglês quando existe, senão o português
export const t = (field, lang) => {
  if (field == null) return '';
  if (typeof field !== 'object') return field;
  return (lang === 'en' && field.en) || field.pt || '';
};

export const tBlocks = (field, lang) => {
  if (!field) return '';
  const blocks = (lang === 'en' && field.en?.length ? field.en : field.pt) || [];
  return toHTML(blocks, {
    components: {
      marks: {
        link: ({ children, value }) => `<a class="ln" href="${value?.href || '#'}" target="_blank" rel="noopener">${children}</a>`,
      },
    },
  });
};

export const UI = {
  pt: {
    works: 'Obras', exhibitions: 'Exposições', publications: 'Publicações', texts: 'Textos', about: 'Sobre',
    chrono: 'Cronológico', random: 'Aleatório', all_f: 'Todas', all_m: 'Todos', solo: 'Individuais', group: 'Coletivas',
    soloOne: 'Individual', groupOne: 'Coletiva', catalogs: 'Catálogos', press: 'Imprensa', catalog: 'Catálogo', pressOne: 'Imprensa',
    by: 'Por Marina Woisky', on: 'Sobre Marina Woisky', newsletter: 'Newsletter', read: 'Ler', next: 'Próxima',
    technique: 'Técnica', dimensions: 'Dimensões', exhibition: 'Exposição', photo: 'Foto', photos: 'Fotos',
    venue: 'Local', city: 'Cidade', dates: 'Datas', text: 'Texto', more: 'Mais', visit: 'Acesse aqui', worksShown: 'Obras',
    contact: 'Contato', gallery: 'Galeria', galleries: 'Galerias', cvPdf: 'CV em PDF', instagram: 'Instagram',
    view: 'vista', prev: 'Imagem anterior', nextImg: 'Próxima imagem', menu: 'Menu', close: 'Fechar',
    notFound: 'Página não encontrada.', backHome: 'Voltar para Obras',
  },
  en: {
    works: 'Works', exhibitions: 'Exhibitions', publications: 'Publications', texts: 'Texts', about: 'About',
    chrono: 'Chronological', random: 'Random', all_f: 'All', all_m: 'All', solo: 'Solo', group: 'Group',
    soloOne: 'Solo', groupOne: 'Group', catalogs: 'Catalogues', press: 'Press', catalog: 'Catalogue', pressOne: 'Press',
    by: 'By Marina Woisky', on: 'On Marina Woisky', newsletter: 'Newsletter', read: 'Read', next: 'Next',
    technique: 'Technique', dimensions: 'Dimensions', exhibition: 'Exhibition', photo: 'Photo', photos: 'Photos',
    venue: 'Venue', city: 'City', dates: 'Dates', text: 'Text', more: 'More', visit: 'Visit', worksShown: 'Works',
    contact: 'Contact', gallery: 'Gallery', galleries: 'Galleries', cvPdf: 'CV (PDF)', instagram: 'Instagram',
    view: 'view', prev: 'Previous image', nextImg: 'Next image', menu: 'Menu', close: 'Close',
    notFound: 'Page not found.', backHome: 'Back to Works',
  },
};
