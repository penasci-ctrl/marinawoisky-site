import { defineType, defineField } from 'sanity'

// Campos bilíngues: o português é obrigatório; se o inglês ficar vazio, o site mostra o português.
const pair = (name, title, type, extra = {}) =>
  defineType({
    name,
    title,
    type: 'object',
    options: { columns: type === 'string' ? 2 : 1 },
    fields: [
      defineField({ name: 'pt', title: 'Português', type, validation: (r) => r.required(), ...extra }),
      defineField({ name: 'en', title: 'English', type, ...extra }),
    ],
  })

export const localeString = pair('localeString', 'Texto curto', 'string')
export const localeText = pair('localeText', 'Texto', 'text', { rows: 3 })

// Texto longo com parágrafos, itálico e links (bio, textos, texto de exposição)
const richBlock = {
  type: 'array',
  of: [
    {
      type: 'block',
      styles: [{ title: 'Parágrafo', value: 'normal' }, { title: 'Citação', value: 'blockquote' }],
      lists: [],
      marks: {
        decorators: [{ title: 'Itálico', value: 'em' }],
        annotations: [
          { name: 'link', type: 'object', title: 'Link', fields: [{ name: 'href', type: 'url', title: 'Endereço' }] },
        ],
      },
    },
  ],
}

export const localeBlock = defineType({
  name: 'localeBlock',
  title: 'Texto longo',
  type: 'object',
  fields: [
    defineField({ name: 'pt', title: 'Português', ...richBlock }),
    defineField({ name: 'en', title: 'English', ...richBlock }),
  ],
})

// Imagem com texto alternativo obrigatório (acessibilidade e Google)
export const altImage = defineType({
  name: 'altImage',
  title: 'Imagem',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Descrição da imagem (para quem não enxerga)',
      type: 'string',
      validation: (r) => r.required().error('Descreva a imagem em uma frase.'),
    }),
    defineField({ name: 'caption', title: 'Legenda (opcional)', type: 'string' }),
  ],
})
