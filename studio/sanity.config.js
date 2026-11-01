import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes, SINGLETONS } from './schemaTypes'
import { structure } from './structure'

export default defineConfig({
  name: 'marinawoisky',
  title: 'Marina Woisky',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'wqz875em',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    // Sobre e Configurações existem uma vez só: não aparecem em "criar novo"
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETONS.includes(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      SINGLETONS.includes(schemaType)
        ? actions.filter(({ action }) => ['publish', 'discardChanges', 'restore'].includes(action))
        : actions,
  },
})
