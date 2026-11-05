// Menu lateral do painel, na mesma ordem do site
export const structure = (S) =>
  S.list()
    .title('Site')
    .items([
      S.listItem()
        .title('Obras')
        .schemaType('artwork')
        .child(
          S.documentTypeList('artwork')
            .title('Obras (como na vitrine)')
            .defaultOrdering([{ field: 'year', direction: 'desc' }, { field: 'order', direction: 'asc' }])
        ),
      S.documentTypeListItem('exhibition').title('Exposições'),
      S.documentTypeListItem('publication').title('Publicações'),
      S.divider(),
      S.listItem().title('Sobre').id('about').child(S.document().schemaType('about').documentId('about')),
      S.listItem().title('Configurações').id('settings').child(S.document().schemaType('settings').documentId('settings')),
    ])
