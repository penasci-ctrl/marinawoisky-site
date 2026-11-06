import { defineType, defineField } from 'sanity'

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exposição',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Título', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Endereço', type: 'slug', options: { source: 'title.pt', maxLength: 80 }, validation: (r) => r.required() }),
    defineField({
      name: 'kind',
      title: 'Tipo',
      type: 'string',
      options: { list: [{ title: 'Individual', value: 'solo' }, { title: 'Coletiva', value: 'group' }], layout: 'radio', direction: 'horizontal' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'year', title: 'Ano', type: 'number', validation: (r) => r.required().integer() }),
    defineField({
      name: 'order',
      title: 'Posição dentro do ano',
      description: '1 = primeira exposição desse ano na lista, 2 = segunda… Vazio segue a data de abertura e vai para o fim do ano.',
      type: 'number',
      validation: (r) => r.integer().min(1),
    }),
    defineField({ name: 'venue', title: 'Local', description: 'Ex.: Millan', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'city', title: 'Cidade, país', type: 'localeString' }),
    defineField({ name: 'note', title: 'Observação', description: 'Ex.: com Julia Gallo; curado por Yudi Rafael', type: 'localeString' }),
    defineField({ name: 'startDate', title: 'Abertura', type: 'date' }),
    defineField({ name: 'endDate', title: 'Encerramento', type: 'date' }),
    defineField({
      name: 'images',
      title: 'Fotos da exposição',
      description: 'A primeira aparece grande e na lista de exposições.',
      type: 'array',
      of: [{ type: 'altImage' }],
      options: { layout: 'grid' },
    }),
    defineField({ name: 'photoCredit', title: 'Crédito das fotos', type: 'string' }),
    defineField({ name: 'text', title: 'Texto da exposição', type: 'localeBlock' }),
    defineField({ name: 'textAuthor', title: 'Autor do texto', type: 'string' }),
    defineField({ name: 'link', title: 'Link externo (galeria, instituição)', type: 'url' }),
    defineField({ name: 'showInCvOnly', title: 'Só no CV (sem página própria)', type: 'boolean', initialValue: false }),
  ],
  orderings: [{ title: 'Ano (mais recente)', name: 'yearDesc', by: [{ field: 'year', direction: 'desc' }, { field: 'order', direction: 'asc' }, { field: 'startDate', direction: 'desc' }] }],
  preview: {
    select: { title: 'title.pt', year: 'year', order: 'order', venue: 'venue', media: 'images.0' },
    prepare: ({ title, year, order, venue, media }) => ({ title, subtitle: [year, order ? `${order}º` : null, venue].filter(Boolean).join(' · '), media }),
  },
})
