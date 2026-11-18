import InfoPage from '@/components/info-page'
export default function Page() {
  return (
    <InfoPage
      eyebrow="Help & support"
      title="Get help with your records and decisions."
      intro="Use the guidance below for account, farm data, weather, market and assessment questions. Adviser review workflows require an authorised adviser."
      sections={[
        {
          title: 'Account access',
          text: 'Use your verified email to sign in. Never share your password or authentication link with another person.',
        },
        {
          title: 'Correcting records',
          text: 'Update your profile and records in the app. Assessment outputs should be rerun after corrections.',
        },
        {
          title: 'Agronomic advice',
          text: 'Recommendations needing local diagnosis or exact input rates should be reviewed by a qualified agricultural adviser.',
        },
        {
          title: 'Data requests',
          text: 'You may request access, correction, export or deletion of eligible personal information through the account area.',
        },
      ]}
    />
  )
}
