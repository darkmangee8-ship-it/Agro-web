import { Leaf, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import AuthForm from './auth-form'
import Brand from './brand'

export default function AuthPage({ mode }: { mode: 'sign-in' | 'create-account' }) {
  const create = mode === 'create-account'
  return (
    <main className="grid min-h-screen bg-[#f8f5ec] lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex flex-col px-5 py-7 sm:px-10 lg:px-16">
        <Brand />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <p className="eyebrow">{create ? 'Begin your record' : 'Welcome back'}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.035em] text-[#12382a]">
            {create ? 'Create your farmer account' : 'Sign in to Agro Web'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#66766e]">
            {create
              ? 'Start with the details you have. You can complete your farm profile later.'
              : 'Access your farm records, weather, markets and financial readiness.'}
          </p>
          <AuthForm mode={mode} />
          <p className="mt-7 text-center text-sm text-[#66766e]">
            {create ? 'Already registered?' : 'New to Agro Web?'}{' '}
            <Link
              className="font-semibold text-[#18543b]"
              href={create ? '/sign-in' : '/create-account'}
            >
              {create ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-[#103b2c] p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 size-[34rem] rounded-full border border-white/10" />
        <div className="absolute -right-10 -top-10 size-80 rounded-full border border-[#d4b35e]/20" />
        <div className="relative max-w-lg">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-[#bddc92]">
            <Leaf />
          </span>
          <h2 className="mt-8 text-4xl font-semibold leading-tight tracking-tight">
            Your farm story becomes more useful with every record.
          </h2>
          <p className="mt-5 leading-7 text-white/65">
            Keep farm activity, weather context, market observations and financial records connected
            to one private profile.
          </p>
        </div>
        <div className="relative flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/70">
          <ShieldCheck className="shrink-0 text-[#d4b35e]" /> We verify identity on the server and
          do not trust record ownership supplied by the browser.
        </div>
      </section>
    </main>
  )
}
