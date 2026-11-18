import InfoPage from '@/components/info-page'
export default function Page() {
  return (
    <InfoPage
      eyebrow="Terms of service"
      title="Decision support with clear boundaries."
      intro="By using Agro Web, you acknowledge that farming, weather, markets and finance involve uncertainty and require your own judgment."
      sections={[
        {
          title: 'No guarantees',
          text: 'The platform does not guarantee crop yield, weather outcomes, market profit, loan approval or repayment performance.',
        },
        {
          title: 'Record accuracy',
          text: 'You are responsible for reviewing the information you enter and correcting errors. Uploaded evidence is not automatically verified.',
        },
        {
          title: 'Appropriate use',
          text: "Do not use the platform to access another person's records, upload unlawful material or misrepresent financial information.",
        },
        {
          title: 'Professional review',
          text: 'Seek qualified agronomic, financial, legal or safety advice when a decision requires professional judgment.',
        },
      ]}
    />
  )
}
