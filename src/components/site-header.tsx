'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import Brand from './brand'

const links = [
  ['Platform', '/features'],
  ['How it works', '/how-it-works'],
  ['About', '/about'],
  ['Support', '/support'],
]

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 border-b border-[#173d2e]/10 bg-[#fbfaf5]/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-[#365647] hover:text-[#0d3b2b]"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/sponsor/sign-in" className="px-3 py-2 text-sm font-semibold text-[#365647]">
            Sponsor portal
          </Link>
          <Link href="/sign-in" className="px-4 py-2 text-sm font-semibold text-[#173d2e]">
            Sign in
          </Link>
          <Link
            href="/create-account"
            className="rounded-xl bg-[#0d3b2b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#154f3a]"
          >
            Create account
          </Link>
        </div>
        <button
          className="rounded-lg p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-[#173d2e]/10 bg-[#fbfaf5] px-5 py-5 md:hidden">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="block py-3 font-medium"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link
              href="/sign-in"
              className="rounded-xl border border-[#0d3b2b]/20 px-4 py-3 text-center font-semibold"
            >
              Sign in
            </Link>
            <Link
              href="/create-account"
              className="rounded-xl bg-[#0d3b2b] px-4 py-3 text-center font-semibold text-white"
            >
              Join now
            </Link>
          </div>
          <Link href="/sponsor/sign-in" className="mt-3 block py-2 text-center text-sm font-semibold text-[#286247]" onClick={() => setOpen(false)}>
            Sponsor portal sign in
          </Link>
        </nav>
      )}
    </header>
  )
}
