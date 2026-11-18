import InfoPage from '@/components/info-page'
export default function Page() {
  return (
    <InfoPage
      eyebrow="Data & AI limitations"
      title="Know what the system knows—and what it does not."
      intro="Agro Web separates transparent rules from validated predictive models and does not fill missing information with invented values."
      sections={[
        {
          title: 'Recommendations',
          text: 'Current farm recommendations use documented, transparent rules. They are not crop diagnoses or locally validated yield models.',
        },
        {
          title: 'Weather',
          text: 'Forecasts come from Open-Meteo and can change. They are not confirmed events or guarantees of field-level conditions.',
        },
        {
          title: 'Markets',
          text: 'Price coverage depends on verified imports and may be incomplete or stale. Forecasting is disabled without sufficient consistent history.',
        },
        {
          title: 'Credit risk',
          text: 'No predictive repayment model is deployed. Readiness indicators describe record completeness and cash-flow history, not default probability.',
        },
      ]}
    />
  )
}
