import InfoPage from '@/components/info-page'
export default function Page() {
  return (
    <InfoPage
      eyebrow="Platform features"
      title="Four connected tools. One dependable farm record."
      intro="Agro Web brings practical agricultural information together while keeping data sources, dates and limitations visible."
      sections={[
        {
          title: 'Smart farming',
          text: 'Record farm conditions and receive practical, evidence-labelled recommendations. Generic rules are never presented as validated predictions.',
        },
        {
          title: 'Weather intelligence',
          text: 'Open-Meteo forecasts are retrieved for chosen coordinates with update times, attribution and explainable agricultural risk triggers.',
        },
        {
          title: 'Market intelligence',
          text: 'Search and compare administrator-verified, sourced observations. Unavailable or stale coverage is shown honestly.',
        },
        {
          title: 'Financial identity',
          text: 'Organise sales and expenses into transparent indicators. Predictive credit scoring remains disabled without a lawful validated dataset.',
        },
      ]}
    />
  )
}
