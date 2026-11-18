import { Sprout } from 'lucide-react'
import Link from 'next/link'

export default function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
      <span
        className={`grid size-9 place-items-center rounded-xl ${inverse ? 'bg-white/12 text-[#b7d98a]' : 'bg-[#0d3b2b] text-white'}`}
      >
        <Sprout size={19} strokeWidth={2.2} />
      </span>
      <span className={inverse ? 'text-white' : 'text-[#12372a]'}>
        Agro <span className="text-[#b9872d]">Web</span>
      </span>
    </Link>
  )
}
