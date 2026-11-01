// Conteúdo inicial do site, no mesmo formato dos documentos do Sanity.
// Serve para duas coisas: (1) o site funciona localmente sem Sanity configurado;
// (2) `npm run import:seed` sobe tudo isto (com as imagens de public/seed) para o Sanity, uma vez.
// Depois da importação, o conteúdo passa a ser editado só no painel.

let k = 0;
const key = () => `k${(k++).toString(36)}`;
const L = (pt, en) => ({ pt, ...(en ? { en } : {}) });
const p = (text) => ({ _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: key(), text, marks: [] }] });
const img = (file, w, h, alt, caption) => ({ _type: 'altImage', _key: key(), _seed: file, w, h, alt, ...(caption ? { caption } : {}) });
const ref = (id) => ({ _type: 'reference', _ref: id, _key: key() });
const slug = (s) => ({ _type: 'slug', current: s });

const W = 1800, H = 1238;

export const docs = [
  // ---------------------------------------------------------------- Obras
  {
    _id: 'artwork-abraco-dos-leoes', _type: 'artwork',
    title: L('Abraço dos Leões'), slug: slug('abraco-dos-leoes'), year: 2026, order: 1,
    technique: L('Impressão sobre tecido, argamassa e resina', 'Print on fabric, resin and mortar'),
    dimensions: '48 × 102 × 3 cm', photoCredit: 'Filipe Berndt',
    images: [
      img('abraco-3.jpg', W, H, 'Abraço dos Leões: relevo de dois leões entrelaçados em tons de azul e cinza, na parede branca'),
      img('abraco-2.jpg', W, H, 'Detalhe da textura do relevo Abraço dos Leões'),
      img('abraco-1.jpg', W, H, 'Abraço dos Leões instalado na parede, com uma visitante ao lado para escala'),
    ],
  },
  {
    _id: 'artwork-cavalo-duplo', _type: 'artwork',
    title: L('Cavalo Duplo'), slug: slug('cavalo-duplo'), year: 2026, order: 2,
    technique: L('Impressão sobre tecido, argamassa e resina', 'Print on fabric, resin and mortar'),
    dimensions: '51 × 70 × 2,5 cm', photoCredit: 'Julia Thompson',
    images: [
      img('cavalo-2.jpg', W, H, 'Cavalo Duplo: dois cavalos sobrepostos em tons de verde e rosa, recortados na parede'),
      img('cavalo-1.jpg', 1564, 1075, 'Detalhe da superfície esverdeada de Cavalo Duplo'),
    ],
  },
  {
    _id: 'artwork-opera-dos-leoes', _type: 'artwork',
    title: L('Ópera dos Leões'), slug: slug('opera-dos-leoes'), year: 2025, order: 1,
    technique: L('Impressão sobre tecido, resina e argamassa', 'Print on fabric, resin and mortar'),
    dimensions: '60 × 198 cm', photoCredit: 'Julia Thompson',
    images: [
      img('opera-3.jpg', W, H, 'Ópera dos Leões: sanefa de tecido com quatro máscaras de leão verdes penduradas'),
      img('opera-2.jpg', W, H, 'Detalhe de uma das máscaras de leão de Ópera dos Leões'),
      img('opera-1.jpg', W, H, 'Ópera dos Leões na parede, com uma visitante ao lado para escala'),
    ],
  },

  // ---------------------------------------------------------------- Exposições
  { _id: 'exh-ecos-e-miragens', _type: 'exhibition', title: L('Ecos e Miragens', 'Echoes and Mirages'), slug: slug('ecos-e-miragens'), kind: 'group', year: 2025, venue: 'Almeida & Dale', city: L('São Paulo, Brasil', 'São Paulo, Brazil'), note: L('curado por Yudi Rafael e Carlos Quijon', 'curated by Yudi Rafael and Carlos Quijon') },
  { _id: 'exh-till-the-cows', _type: 'exhibition', title: L('Till the Cows Come Home'), slug: slug('till-the-cows-come-home'), kind: 'group', year: 2025, venue: 'Banquet Gallery', city: L('Milão, Itália', 'Milan, Italy') },
  {
    _id: 'exh-through-the-garden-bars', _type: 'exhibition', title: L('Through the Garden Bars'), slug: slug('through-the-garden-bars'), kind: 'solo', year: 2024, venue: 'L.U.P.O.', city: L('Milão, Itália', 'Milan, Italy'),
    images: [
      img('lupo-1.jpg', W, H, 'Vista da exposição Through the Garden Bars, com três máscaras sobre hastes no centro da sala'),
      img('lupo-3.jpg', W, H, 'Vista da sala da L.U.P.O. com relevos nas paredes brancas'),
      img('lupo-2.jpg', W, H, 'Cabeça de cavalo e relevo verde na parede, na exposição Through the Garden Bars'),
    ],
    text: { pt: [p('[Texto da exposição.]')] },
  },
  {
    _id: 'exh-panorama-mil-graus', _type: 'exhibition', title: L('38º Panorama da Arte Brasileira: Mil graus', '38th Panorama of Brazilian Art: Mil graus'), slug: slug('panorama-mil-graus'), kind: 'group', year: 2024, venue: 'MAM São Paulo, no MAC USP', city: L('São Paulo, Brasil', 'São Paulo, Brazil'), note: L('curado por Germano Dushá e Thiago de Paula Souza', 'curated by Germano Dushá and Thiago de Paula Souza'),
    images: [
      img('panorama-3.jpg', W, H, 'Vista da instalação de Marina Woisky no 38º Panorama, com aves e figuras sobre o piso branco'),
      img('panorama-1.jpg', W, H, 'Esculturas de aves e figuras na sala do Panorama'),
      img('panorama-2.jpg', W, H, 'Ave de pernas longas em primeiro plano, na instalação do Panorama'),
    ],
    text: { pt: [p('[Texto da exposição.]')] },
  },
  { _id: 'exh-vrummm', _type: 'exhibition', title: L('VRUMMM'), slug: slug('vrummm'), kind: 'solo', year: 2024, venue: 'Millan', city: L('São Paulo, Brasil', 'São Paulo, Brazil'), note: L('com Julia Gallo', 'with Julia Gallo') },
  { _id: 'exh-pedras-e-bichos', _type: 'exhibition', title: L('Pedras e bichos d’água', 'Water Stones and Creatures'), slug: slug('pedras-e-bichos-dagua'), kind: 'solo', year: 2023, venue: 'Millan', city: L('São Paulo, Brasil', 'São Paulo, Brazil'), photoCredit: 'Ana Pigosso' },
  { _id: 'exh-abre-alas-17', _type: 'exhibition', title: L('Abre Alas 17'), slug: slug('abre-alas-17'), kind: 'group', year: 2022, venue: 'A Gentil Carioca', city: L('Rio de Janeiro, Brasil', 'Rio de Janeiro, Brazil') },

  // ---------------------------------------------------------------- Publicações
  { _id: 'pub-gq-2026', _type: 'publication', category: 'press', year: 2026, outlet: 'GQ Brasil', title: L('Crise ou reconfiguração? Brasil ganha força em meio a mudanças no mercado de arte global') },
  { _id: 'pub-ecos', _type: 'publication', category: 'catalog', year: 2025, outlet: 'Almeida & Dale', title: L('Ecos e Miragens', 'Echoes and Mirages'), images: [img('pub-ecos.jpg', 1600, 1100, 'Páginas do catálogo Ecos e Miragens com texto sobre Marina Woisky')] },
  { _id: 'pub-artreview', _type: 'publication', category: 'press', year: 2025, outlet: 'ArtReview', title: L('Future Greats 2025: Marina Woisky'), images: [img('pub-artreview.jpg', 1600, 1100, 'Páginas da ArtReview com obras de Marina Woisky, selecionada por Oliver Basciano')] },
  { _id: 'pub-panorama', _type: 'publication', category: 'catalog', year: 2024, outlet: 'MAM São Paulo', title: L('38º Panorama da Arte Brasileira: Mil graus', '38th Panorama of Brazilian Art: Mil graus'), images: [img('pub-panorama.jpg', 1600, 1100, 'Páginas do catálogo do 38º Panorama dedicadas a Marina Woisky')] },
  { _id: 'pub-artslife', _type: 'publication', category: 'press', year: 2024, outlet: 'Artslife', title: L('Un futuro di specie ibride: Marina Woisky da L.U.P.O.') },
  { _id: 'pub-artishock', _type: 'publication', category: 'press', year: 2024, outlet: 'Artishock', title: L('Mil Graus: 38º Panorama del Arte Brasileño') },
  { _id: 'pub-artforum', _type: 'publication', category: 'press', year: 2024, outlet: 'Artforum', title: L('“Mil Graus” Museu de Arte Moderna de São Paulo (MAM)') },
  { _id: 'pub-veja-panorama', _type: 'publication', category: 'press', year: 2024, outlet: 'Veja São Paulo', title: L('Panorama da Arte Brasileira completa 55 anos com edição no MAC') },
  { _id: 'pub-dailylazy', _type: 'publication', category: 'press', year: 2024, outlet: 'Daily Lazy', title: L('Julia Gallo and Marina Woisky at Millan / São Paulo') },
  { _id: 'pub-veja-millan', _type: 'publication', category: 'press', year: 2024, outlet: 'Veja São Paulo', title: L('Millan abre exposição com obras de Julia Gallo e Marina Woisky') },
  { _id: 'pub-contraflecha', _type: 'publication', category: 'catalog', year: 2023, outlet: 'Almeida & Dale', title: L('Contra-Flecha'), images: [img('pub-contraflecha.jpg', 1600, 1101, 'Páginas rosa do catálogo Contra-Flecha com texto e obras de Marina Woisky')] },
  { _id: 'pub-select', _type: 'publication', category: 'press', year: 2023, outlet: 'Select', title: L('Pedras e bichos d’água, de Marina Woisky') },
  { _id: 'pub-arteque', _type: 'publication', category: 'press', year: 2023, outlet: 'Artequeacontece', title: L('23 artistas brasileiros emergentes para ficar de olho em 2023') },
  { _id: 'pub-sparte', _type: 'publication', category: 'press', year: 2023, outlet: 'SP–Arte', title: L('Dez artistas para ficar de olho em 2023') },
  { _id: 'pub-terremoto', _type: 'publication', category: 'press', year: 2022, outlet: 'Terremoto', title: L('Abre Alas 17: collective exhibition at A Gentil Carioca') },
  { _id: 'pub-dasartes', _type: 'publication', category: 'press', year: 2022, outlet: 'Dasartes', title: L('Julia Gallo e Marina Woisky | Galeria Metrópole') },

  // ---------------------------------------------------------------- Textos
  { _id: 'essay-future-greats', _type: 'essay', kind: 'about', author: 'Oliver Basciano', year: 2025, title: L('Future Greats 2025'), context: L('ArtReview'), body: { pt: [p('[Texto completo — colar aqui.]')] } },

  // ---------------------------------------------------------------- Sobre
  {
    _id: 'about', _type: 'about',
    bio: {
      pt: [
        p('Marina Woisky (São Paulo, Brasil, 1996) utiliza imagens de objetos decorativos e de ornamentos com representações orgânicas como substrato para sua produção. Distorcidas, deslocadas e comprimidas por sucessivas transposições materiais e pela passagem do tempo, essas imagens são transformadas pela artista em animais e paisagens extraordinários e quiméricos, apresentados em obras que se posicionam no limiar entre a bi e a tridimensionalidade.'),
        p('Com isso, a artista aborda a representação, problema fundamental das artes, e noções de gosto, assim como o próprio estatuto imagético na sociedade contemporânea. Woisky é graduada em artes visuais pela Universidade Estadual Paulista (Unesp), São Paulo.'),
      ],
      en: [
        p('Marina Woisky (São Paulo, Brazil, 1996) relies on images of decorative objects and ornaments with organic forms as a substrate for her artistic production. Distorted, displaced, and compressed through successive material transpositions and the passage of time, these images undergo a transformation by the artist into extraordinary and chimerical animals and landscapes.'),
        p('Her works fall in the liminal space between bi and three-dimensionality. Through this, the artist addresses representation, a fundamental issue in the arts, as well as notions of taste and the very status of the image in contemporary society. Woisky holds a BFA from Unesp, São Paulo.'),
      ],
    },
    portrait: img('retrato-atelie.jpg', 1600, 1067, 'Marina Woisky costurando no ateliê, cercada por obras'),
    portraitCredit: 'Victor Affaro',
    cv: [
      ['Formação', 'Education', [['2016–21', 'Bacharelado e Licenciatura em Artes Visuais, Instituto de Artes da Unesp, São Paulo', 'BFA and Teaching Degree in Visual Arts, Instituto de Artes da Unesp, São Paulo']]],
      ['Individuais', 'Solo exhibitions', [
        ['2024', 'Through the Garden Bars, L.U.P.O. Gallery, Milão, Itália', 'Through the Garden Bars, L.U.P.O. Gallery, Milan, Italy'],
        ['2023', 'Pedras e bichos d’água, Millan, São Paulo', 'Water Stones and Creatures, Millan, São Paulo'],
      ]],
      ['Coletivas', 'Group exhibitions', [
        ['2026', 'O Drama da Forma, curado por Rita Vênus, Claraboia, São Paulo'], ['', 'Falácia Natural, Galeria Refresco, Rio de Janeiro'],
        ['2025', 'Ecos e Miragens, curado por Yudi Rafael e Carlos Quijon, Almeida & Dale, São Paulo'], ['', '38º Panorama da Arte Brasileira: Mil graus, Sesc Campinas'], ['', 'Till the Cows Come Home, Banquet Gallery, Milão', 'Till the Cows Come Home, Banquet Gallery, Milan'],
        ['2024', '38º Panorama da Arte Brasileira: Mil graus, MAM São Paulo'], ['', 'VRUMMM, Millan, São Paulo'], ['', 'Porvir, Gruta, São Paulo'], ['', 'Areoporto, São Paulo'],
        ['2023', 'Still Life/Still Living, Olhão e Lamb Gallery'], ['', 'Paura, Era Gallery, Milão', 'Paura, Era Gallery, Milan'], ['', 'Contra-Flecha, Almeida & Dale, São Paulo'],
        ['2022', 'Desmanchar, Desfaz, Quadra'], ['', 'Atlas nº 4, Massapê Projetos'], ['', 'Sobre monstros, Lona Galeria'], ['', 'Abre Alas 17, A Gentil Carioca, Rio de Janeiro'], ['', 'Ato, 25M'],
        ['2020', '45º Salão de Arte de Ribeirão Preto, MARP'], ['', '48º Salão Luiz Sacilotto, Santo André'], ['', 'Arte Londrina 8, online'],
        ['2019', 'Vivesse também com esquivanças, IA Unesp'], ['', 'IV Bienal do Sertão, Teresina'], ['', '44º Salão de Arte de Ribeirão Preto'], ['', 'Abraço Coletivo, Ateliê 397'],
        ['2018', 'Don’t Touch Me, IA Unesp'], ['', 'Um cômodo bem pequeno, IA Unesp'],
      ]],
      ['Residências', 'Residencies', [
        ['2025', 'Pós-natural e outras ecologias, Museu do Amanhã, Rio de Janeiro'],
        ['2018', 'L.O.T.E., Fundação Marcos Amaro, Itu (SP)'], ['2017', 'L.O.T.E., Fazenda Serrinha, Bragança Paulista (SP)'], ['2016', 'L.O.T.E., Fundação Marcos Amaro, Itu (SP)'],
      ]],
      ['Outros projetos', 'Other projects', [
        ['2025', 'ArtReview Future Greats 2025'], ['', 'Produção executiva de Modos de Ver, COP30, Casa da Floresta Unesp / Instituto Peabiru, Belém', 'Executive production of Modos de Ver, COP30, Casa da Floresta Unesp / Instituto Peabiru, Belém'],
        ['2019', 'Somos muit+s: experimento sobre coletividade, Pinacoteca do Estado de São Paulo'], ['', 'Vínculos (site specific), Locação Paisagem – USP, São Paulo'],
      ]],
      ['Prêmios', 'Awards', [['2023', 'Indicação ao Prêmio PIPA', 'Nominated for the PIPA Prize']]],
      ['Acervos', 'Collections', [['', 'Pinacoteca do Estado de São Paulo']]],
    ].map(([pt, en, rows]) => ({
      _type: 'cvSection', _key: key(), title: L(pt, en),
      entries: rows.map(([year, tpt, ten]) => ({ _type: 'cvEntry', _key: key(), year, text: L(tpt, ten) })),
    })),
  },

  // ---------------------------------------------------------------- Configurações
  {
    _id: 'settings', _type: 'settings',
    galleries: [{ _type: 'gallery', _key: key(), name: 'Almeida & Dale', city: L('São Paulo') }],
    _seedOpening: { web: 'escultura-web.glb', mobile: 'escultura-mobile.glb' },
    description: L(
      'Marina Woisky (São Paulo, 1996) é artista visual. Obras, exposições, publicações e textos.',
      'Marina Woisky (São Paulo, 1996) is a visual artist. Works, exhibitions, publications and texts.'
    ),
  },
];
