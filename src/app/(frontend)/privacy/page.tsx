import InfoPage from '@/components/info-page'
export default function Page() {
  return (
    <InfoPage
      eyebrow="Privacy policy"
      title="Your information should work for you—not against you."
      intro="This production-preparation policy describes the intended data practices. Nigerian data protection counsel must review the final deployment and operations."
      sections={[
        {
          title: 'Information collected',
          text: 'Account identity, optional farm location, farm records, activity history and financial records you choose to provide.',
        },
        {
          title: 'Purposes',
          text: 'To operate your account, generate contextual farm guidance, retrieve local weather and calculate transparent financial indicators.',
        },
        {
          title: 'Sharing and consent',
          text: 'Sensitive financial information is not shared with third parties without an appropriate legal basis and explicit consent.',
        },
        {
          title: 'Retention and rights',
          text: 'Records are retained while your account is active or as legally required. Access, correction, export and eligible deletion processes must be operational before production launch.',
        },
      ]}
    />
  )
}
