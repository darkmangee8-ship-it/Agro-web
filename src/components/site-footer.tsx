import Link from 'next/link'
import Brand from './brand'

export default function SiteFooter() {
  return (
    <footer className="bg-[#0b3024] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Brand inverse />
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
            Smarter Farming. Stronger Farmers. Better Harvests.
          </p>
          <p className="mt-3 max-w-md text-xs leading-5 text-white/45">
            Agricultural guidance and financial readiness information are decision support, not
            guarantees of yield, diagnosis, credit approval, or market returns.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#d7b66a]">Platform</p>
          <div className="mt-4 grid gap-3 text-sm text-white/70">
            <Link href="/features">Features</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/about">About</Link>
            <Link href="/support">Support</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#d7b66a]">Trust & legal</p>
          <div className="mt-4 grid gap-3 text-sm text-white/70">
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of service</Link>
            <Link href="/ai-limitations">Data & AI limitations</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/45">
        © 2026 Agro Web. Built for responsible agricultural decision support in Nigeria.
      </div>
    </footer>
  )
}
