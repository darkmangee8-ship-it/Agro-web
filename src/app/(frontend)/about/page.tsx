import InfoPage from '@/components/info-page'
export default function Page() {
  return (
    <InfoPage
      eyebrow="About Agro Web"
      title="Agricultural intelligence built around farmer agency."
      intro="Agro Web is designed for Nigerian farmers and advisers who need clearer records and honest decision support—not exaggerated claims."
      sections={[
        {
          title: 'Nigeria first',
          text: 'The product supports Nigerian states and LGAs, Naira, metric units, mobile screens and low-bandwidth workflows.',
        },
        {
          title: 'Expandable by design',
          text: 'Geography, units, sources and agronomic references are modelled so additional African markets can be added responsibly.',
        },
        {
          title: 'Evidence before claims',
          text: 'We do not fabricate impact statistics, market prices, lender decisions, repayment histories or model performance.',
        },
        {
          title: 'Responsible finance',
          text: 'Agro Web is not a bank, lender or credit bureau. Financial readiness does not guarantee loan approval.',
        },
      ]}
    />
  )
}
