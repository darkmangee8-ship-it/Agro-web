import { Leaf, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import AuthForm from './auth-form'
import Brand from './brand'

export default function AuthPage({ mode, audience = 'farmer' }: { mode: 'sign-in' | 'create-account'; audience?: 'farmer' | 'sponsor' }) {
  const create = mode === 'create-account'
  const prefix = audience === 'sponsor' ? '/sponsor' : ''
  return (
    <main className="grid min-h-screen bg-[#f8f5ec] lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex flex-col px-5 py-7 sm:px-10 lg:px-16">
        <Brand />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <p className="eyebrow">{audience === 'sponsor' ? 'Lender and sponsor portal' : create ? 'Begin your record' : 'Welcome back'}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.035em] text-[#12382a]">
            {create ? `Create your ${audience} account` : `Sign in as a ${audience}`}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#66766e]">
            {audience === 'sponsor'
              ? 'Use the dedicated sponsor portal. New organizations are reviewed before they can view any farmer application.'
              : create
                ? 'Start with the details you have. You can complete your farm profile later.'
                : 'Access your farm records, weather, markets and financial readiness.'}
          </p>
          <AuthForm mode={mode} audience={audience} />
          <p className="mt-7 text-center text-sm text-[#66766e]">
            {create ? 'Already registered?' : 'New to Agro Web?'}{' '}
            <Link
              className="font-semibold text-[#18543b]"
              href={create ? `${prefix}/sign-in` : `${prefix}/create-account`}
            >
              {create ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-[#66766e]">
            {audience === 'sponsor' ? 'Are you a farmer?' : 'Representing a bank or sponsor?'}{' '}
            <Link className="font-semibold text-[#18543b]" href={audience === 'sponsor' ? '/sign-in' : '/sponsor/sign-in'}>
              {audience === 'sponsor' ? 'Farmer sign in' : 'Sponsor sign in'}
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
            {audience === 'sponsor' ? 'Responsible funding starts with transparent farm records.' : 'Your farm story becomes more useful with every record.'}
          </h2>
          <p className="mt-5 leading-7 text-white/65">
            {audience === 'sponsor' ? 'Approved lenders can review applications only after a farmer explicitly shares them. Organization verification is required.' : 'Keep farm activity, weather context, market observations and financial records connected to one private profile.'}
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
