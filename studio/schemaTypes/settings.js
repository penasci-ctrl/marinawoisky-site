import { defineType, defineField } from 'sanity'

export const settings = defineType({
  name: 'settings',
  title: 'Configurações',
  type: 'document',
  groups: [
    { name: 'contact', title: 'Contato', default: true },
    { name: 'opening', title: 'Abertura' },
    { name: 'seo', title: 'Google e compartilhamento' },
  ],
  fields: [
    defineField({ name: 'email', title: 'E-mail', type: 'string', group: 'contact', validation: (r) => r.email() }),
    defineField({ name: 'instagram', title: 'Instagram (link)', type: 'url', group: 'contact' }),
    defineField({ name: 'newsletter', title: 'Newsletter / Substack (link)', type: 'url', group: 'contact' }),
    defineField({
      name: 'galleries',
      title: 'Galerias',
      type: 'array',
      group: 'contact',
      of: [
        {
          type: 'object',
          name: 'gallery',
          fields: [
            defineField({ name: 'name', title: 'Nome', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'city', title: 'Cidade', type: 'localeString' }),
            defineField({ name: 'url', title: 'Site', type: 'url' }),
          ],
          preview: { select: { title: 'name', subtitle: 'city.pt' } },
        },
      ],
    }),
    defineField({
      name: 'openingModel',
      title: 'Escultura 3D da abertura (.glb, computador)',
      description: 'Arquivo otimizado, até ~3 MB.',
      type: 'file',
      group: 'opening',
      options: { accept: '.glb' },
    }),
    defineField({
      name: 'openingModelMobile',
      title: 'Escultura 3D da abertura (.glb, celular)',
      description: 'Versão mais leve, até ~2 MB. Se ficar vazio, usa a do computador.',
      type: 'file',
      group: 'opening',
      options: { accept: '.glb' },
    }),
    defineField({
      name: 'openingArtwork',
      title: 'Obra da abertura',
      description: 'Título e ano que aparecem embaixo da escultura.',
      type: 'reference',
      to: [{ type: 'artwork' }],
      group: 'opening',
    }),
    defineField({ name: 'description', title: 'Descrição para o Google', type: 'localeText', group: 'seo' }),
    defineField({ name: 'shareImage', title: 'Imagem de compartilhamento (WhatsApp, redes)', type: 'altImage', group: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Configurações' }) },
})
