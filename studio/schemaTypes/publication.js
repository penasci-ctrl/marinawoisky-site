import { defineType, defineField } from 'sanity'

export const publication = defineType({
  name: 'publication',
  title: 'Publicação',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Título', type: 'localeString', validation: (r) => r.required() }),
    defineField({
      name: 'category',
      title: 'Categoria',
      type: 'string',
      options: { list: [{ title: 'Catálogo', value: 'catalog' }, { title: 'Imprensa', value: 'press' }], layout: 'radio', direction: 'horizontal' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'outlet', title: 'Veículo ou editora', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'year', title: 'Ano', type: 'number', validation: (r) => r.required().integer() }),
    defineField({ name: 'link', title: 'Link para ler', type: 'url' }),
    defineField({ name: 'pdf', title: 'PDF (se não houver link)', type: 'file', options: { accept: '.pdf' } }),
    defineField({
      name: 'images',
      title: 'Fotos da publicação',
      description: 'Aparecem ao clicar no título.',
      type: 'array',
      of: [{ type: 'altImage' }],
      options: { layout: 'grid' },
    }),
  ],
  orderings: [{ title: 'Ano (mais recente)', name: 'yearDesc', by: [{ field: 'year', direction: 'desc' }] }],
  preview: {
    select: { title: 'title.pt', year: 'year', outlet: 'outlet', media: 'images.0' },
    prepare: ({ title, year, outlet, media }) => ({ title, subtitle: [year, outlet].filter(Boolean).join(' · '), media }),
  },
})
