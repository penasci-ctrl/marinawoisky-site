import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'wqz875em',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // endereço do painel: https://marinawoisky.sanity.studio
  studioHost: 'marinawoisky',
  deployment: { appId: 'r4i782gwuqbujte6klnfitbr' },
})
