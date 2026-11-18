import InfoPage from '@/components/info-page'
export default function Page() {
  return (
    <InfoPage
      eyebrow="How it works"
      title="From farm details to clearer next steps."
      intro="The platform builds context gradually, separates farmer-reported information from supported evidence, and keeps important uncertainty visible."
      sections={[
        {
          title: 'Create your private profile',
          text: 'Choose your Nigerian state and LGA, record farm size, crops, growing method and optional coordinates.',
        },
        {
          title: 'Keep a farm timeline',
          text: 'Log planting, irrigation, observations, inputs, harvests, sales and costs as they happen.',
        },
        {
          title: 'Review live and sourced context',
          text: 'See weather from Open-Meteo and market observations only when a verified source is available.',
        },
        {
          title: 'Use explanations—not black boxes',
          text: 'Every readiness result and farming action states its inputs, logic, status and limits. Human review stays important.',
        },
      ]}
    />
  )
}
