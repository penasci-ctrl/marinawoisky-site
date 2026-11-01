import { defineType, defineField } from 'sanity'

export const text = defineType({
  name: 'essay',
  title: 'Texto',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Título', type: 'localeString', validation: (r) => r.required() }),
    defineField({
      name: 'kind',
      title: 'Tipo',
      type: 'string',
      options: {
        list: [
          { title: 'Por Marina Woisky', value: 'by' },
          { title: 'Sobre Marina Woisky', value: 'about' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'author', title: 'Autor', type: 'string', initialValue: 'Marina Woisky', validation: (r) => r.required() }),
    defineField({ name: 'year', title: 'Ano', type: 'number', validation: (r) => r.required().integer() }),
    defineField({ name: 'context', title: 'Onde foi publicado', description: 'Ex.: Exposição, Millan; ArtReview; Newsletter', type: 'localeString' }),
    defineField({ name: 'body', title: 'Texto completo', type: 'localeBlock' }),
    defineField({ name: 'link', title: 'Link para o original (opcional)', type: 'url' }),
  ],
  orderings: [{ title: 'Ano (mais recente)', name: 'yearDesc', by: [{ field: 'year', direction: 'desc' }] }],
  preview: {
    select: { title: 'title.pt', author: 'author', year: 'year' },
    prepare: ({ title, author, year }) => ({ title, subtitle: [author, year].filter(Boolean).join(' · ') }),
  },
})
