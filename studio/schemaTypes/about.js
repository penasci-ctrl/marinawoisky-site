import { defineType, defineField } from 'sanity'

export const about = defineType({
  name: 'about',
  title: 'Sobre',
  type: 'document',
  fields: [
    defineField({ name: 'bio', title: 'Bio', type: 'localeBlock', validation: (r) => r.required() }),
    defineField({
      name: 'cv',
      title: 'CV',
      description: 'Cada seção (Formação, Individuais, Coletivas…) com suas linhas. Preencha o ano em todas as linhas, em qualquer ordem: o site ordena do mais recente para o mais antigo e mostra cada ano uma vez só.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'cvSection',
          title: 'Seção',
          fields: [
            defineField({ name: 'title', title: 'Nome da seção', type: 'localeString', validation: (r) => r.required() }),
            defineField({
              name: 'entries',
              title: 'Linhas',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'cvEntry',
                  fields: [
                    defineField({ name: 'year', title: 'Ano', description: 'Ex.: 2024 ou 2016–21', type: 'string', validation: (r) => r.required() }),
                    defineField({ name: 'text', title: 'Texto', type: 'localeString', validation: (r) => r.required() }),
                  ],
                  preview: { select: { title: 'text.pt', subtitle: 'year' } },
                },
              ],
            }),
          ],
          preview: { select: { title: 'title.pt' } },
        },
      ],
    }),
    defineField({ name: 'portrait', title: 'Retrato (fim da página)', type: 'altImage' }),
    defineField({ name: 'portraitCredit', title: 'Crédito do retrato', type: 'string' }),
    defineField({ name: 'cvPdf', title: 'CV em PDF', type: 'file', options: { accept: '.pdf' } }),
  ],
  preview: { prepare: () => ({ title: 'Sobre' }) },
})
