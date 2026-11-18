import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import SiteFooter from './site-footer'
import SiteHeader from './site-header'

export default function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string
  title: string
  intro: string
  sections: Array<{ title: string; text: string }>
}) {
  return (
    <main>
      <SiteHeader />
      <section className="border-b border-[#153c2d]/10 bg-[#f5f1e5] py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-.04em] text-[#12382a] sm:text-6xl">
            {title}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#586e62]">{intro}</p>
        </div>
      </section>
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-5xl gap-6 px-5 md:grid-cols-2 lg:px-8">
          {sections.map((section, i) => (
            <article
              key={section.title}
              className="rounded-2xl border border-[#153c2d]/10 bg-[#fffefa] p-7"
            >
              <span className="text-xs font-bold text-[#ad7e28]">0{i + 1}</span>
              <h2 className="mt-5 text-2xl font-semibold text-[#153a2d]">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#66776f]">{section.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-[#e8efe7] py-14">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-5 px-5 sm:flex-row sm:items-center lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold">Ready to build a reliable farm record?</h2>
            <p className="mt-1 text-sm text-[#607167]">Start free. Add information at your pace.</p>
          </div>
          <Link
            href="/create-account"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0d3b2b] px-5 py-3 font-semibold text-white"
          >
            Create account <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
