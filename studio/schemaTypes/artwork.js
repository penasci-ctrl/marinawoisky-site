import { defineType, defineField } from 'sanity'

export const artwork = defineType({
  name: 'artwork',
  title: 'Obra',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Título', type: 'localeString', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Endereço',
      description: 'Gerado a partir do título. Ex.: abraco-dos-leoes',
      type: 'slug',
      options: { source: 'title.pt', maxLength: 80 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'year', title: 'Ano', type: 'number', validation: (r) => r.required().integer().min(2010).max(2100) }),
    defineField({
      name: 'images',
      title: 'Fotos',
      description: 'A primeira é a capa. A segunda aparece quando o mouse passa sobre a obra no índice.',
      type: 'array',
      of: [{ type: 'altImage' }],
      options: { layout: 'grid' },
      validation: (r) => r.required().min(1),
    }),
    defineField({ name: 'technique', title: 'Técnica', type: 'localeString' }),
    defineField({ name: 'dimensions', title: 'Dimensões', description: 'Ex.: 48 × 102 × 3 cm', type: 'string' }),
    defineField({ name: 'photoCredit', title: 'Crédito das fotos', type: 'string' }),
    defineField({
      name: 'exhibitions',
      title: 'Exposições em que esteve',
      description: 'Vira um link na ficha da obra.',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'exhibition' }] }],
    }),
    defineField({
      name: 'order',
      title: 'Ordem dentro do ano',
      description: 'Menor aparece primeiro. Pode deixar vazio.',
      type: 'number',
    }),
    defineField({
      name: 'model3d',
      title: 'Modelo 3D (.glb, opcional)',
      description: 'Scan da escultura. Use um arquivo otimizado de até ~3 MB.',
      type: 'file',
      options: { accept: '.glb' },
    }),
    defineField({ name: 'hidden', title: 'Esconder do site', type: 'boolean', initialValue: false }),
  ],
  orderings: [{ title: 'Ano (mais recente)', name: 'yearDesc', by: [{ field: 'year', direction: 'desc' }, { field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title.pt', year: 'year', media: 'images.0' },
    prepare: ({ title, year, media }) => ({ title, subtitle: year ? String(year) : '', media }),
  },
})
