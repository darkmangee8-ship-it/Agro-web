import { ArrowRight, BarChart3, CloudSun, Landmark, Leaf, MapPin, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import SiteFooter from '@/components/site-footer'
import SiteHeader from '@/components/site-header'

const modules = [
  {
    icon: Leaf,
    n: '01',
    title: 'Smart farming',
    text: 'Turn farm, soil, season and crop records into transparent, evidence-linked actions.',
  },
  {
    icon: CloudSun,
    n: '02',
    title: 'Weather & alerts',
    text: 'See real Open-Meteo forecasts and explainable risk alerts for your chosen farm coordinates.',
  },
  {
    icon: BarChart3,
    n: '03',
    title: 'Market intelligence',
    text: 'Compare sourced, dated and unit-aware market observations—never invented live prices.',
  },
  {
    icon: Landmark,
    n: '04',
    title: 'Financial identity',
    text: 'Organise sales and costs into an explainable readiness profile without pretending to approve loans.',
  },
]

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <section className="relative overflow-hidden bg-[#f7f3e8]">
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[#123d2d] lg:block" />
        <div className="relative mx-auto grid min-h-[690px] max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#af842c]/25 bg-[#fffdf6] px-3.5 py-2 text-xs font-semibold uppercase tracking-[.14em] text-[#805d17]">
              <MapPin size={14} /> Built for Nigerian agriculture
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-[-.045em] text-[#10382a] sm:text-6xl lg:text-7xl">
              Better decisions, from soil to sale.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#4b6559]">
              One trusted workspace for farm records, live weather, verified market information and
              responsible financial readiness.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/create-account"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d3b2b] px-6 py-3.5 font-semibold text-white shadow-lg shadow-[#0d3b2b]/15"
              >
                Start as a farmer <ArrowRight size={18} />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-[#173d2e]/15 bg-white/60 px-6 py-3.5 font-semibold text-[#173d2e]"
              >
                See how it works
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm text-[#52695e]">
              <ShieldCheck className="text-[#2f7655]" size={20} /> Your records stay private and
              access-controlled.
            </div>
          </div>
          <div className="relative lg:pl-8">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-[#194c38] p-6 text-white shadow-2xl shadow-black/20 sm:p-8">
              <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[#d7b35c]/15 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#d5bd7b]">
                Farm intelligence workspace
              </p>
              <div className="mt-7 rounded-2xl bg-white p-5 text-[#16392c]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#6b7d73]">Today in your farm area</p>
                    <p className="mt-1 text-lg font-semibold">Live data when you sign in</p>
                  </div>
                  <CloudSun className="text-[#b48128]" size={32} />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#16392c]/10 pt-4 text-center">
                  <div>
                    <p className="text-lg font-semibold">7-day</p>
                    <p className="text-[11px] text-[#718078]">forecast</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">NGN</p>
                    <p className="text-[11px] text-[#718078]">native currency</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Metric</p>
                    <p className="text-[11px] text-[#718078]">farm units</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <Leaf className="text-[#b9d88b]" />
                  <p className="mt-5 font-semibold">Evidence status shown</p>
                  <p className="mt-1 text-xs leading-5 text-white/60">
                    Know what supports each recommendation.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <BarChart3 className="text-[#d7b66a]" />
                  <p className="mt-5 font-semibold">No fake prices</p>
                  <p className="mt-1 text-xs leading-5 text-white/60">
                    Missing or stale data stays clearly labelled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">One farmer profile, four connected tools</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.035em] text-[#13382b] sm:text-5xl">
              Practical intelligence, not empty promises.
            </h2>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-[#173d2e]/10 bg-[#173d2e]/10 md:grid-cols-2 lg:grid-cols-4">
            {modules.map(({ icon: Icon, n, title, text }) => (
              <article key={title} className="bg-[#fffefa] p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-[#e7efe8] text-[#1f5a41]">
                    <Icon size={21} />
                  </span>
                  <span className="text-xs font-semibold text-[#b1812d]">{n}</span>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-[#17382c]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#64746c]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#eaf0e8] py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="eyebrow">Start with what you know</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-[#14392c]">
              Build a useful farm record a little at a time.
            </h2>
            <p className="mt-3 text-[#5d7166]">Missing information is identified—not invented.</p>
          </div>
          <Link
            href="/create-account"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#b5832c] px-6 py-3.5 font-semibold text-white"
          >
            Create your profile <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
