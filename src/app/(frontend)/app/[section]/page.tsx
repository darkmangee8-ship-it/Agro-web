import { notFound } from 'next/navigation'
import AppShell from '@/components/app-shell'

const sections = [
  'dashboard',
  'farm',
  'smart-farming',
  'weather',
  'markets',
  'financial',
  'credit',
  'sponsor',
  'notifications',
  'settings',
  'help',
  'admin',
]

export function generateStaticParams() {
  return sections.map((section) => ({ section }))
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!sections.includes(section)) notFound()
  return <AppShell section={section} />
}
