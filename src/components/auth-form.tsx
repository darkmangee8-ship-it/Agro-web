'use client'

import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { authClient } from '@/lib/auth-client'

export default function AuthForm({ mode }: { mode: 'sign-in' | 'create-account' }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    if (password.length < 8) {
      setMessage('Use at least 8 characters for your password.')
      setBusy(false)
      return
    }
    try {
      const result =
        mode === 'sign-in'
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({
            email,
            password,
            name: String(form.get('name') ?? '').trim(),
          })
      if (result.error) {
        setMessage(result.error.message ?? 'Unable to authenticate')
        return
      }
      router.push('/app/dashboard')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to authenticate')
    } finally {
      setBusy(false)
    }
  }

  const create = mode === 'create-account'
  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      {create && (
        <label className="block text-sm font-medium">
          Full name
          <input className="field mt-2" name="name" required autoComplete="name" />
        </label>
      )}
      <label className="block text-sm font-medium">
        Email address
        <input className="field mt-2" name="email" required type="email" autoComplete="email" />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input
          className="field mt-2"
          name="password"
          required
          type="password"
          minLength={8}
          autoComplete={create ? 'new-password' : 'current-password'}
        />
      </label>
      {create && (
        <label className="flex items-start gap-3 text-xs leading-5 text-[#687970]">
          <input type="checkbox" required className="mt-1 accent-[#1d5a40]" />{' '}
          <span>
            I agree to the{' '}
            <Link href="/terms" className="font-semibold underline">
              Terms
            </Link>{' '}
            and acknowledge the{' '}
            <Link href="/privacy" className="font-semibold underline">
              Privacy Policy
            </Link>
            . Financial assessment consent is collected separately.
          </span>
        </label>
      )}
      {message && (
        <div role="alert" className="flex gap-2 rounded-xl bg-[#fff4e6] p-3 text-sm text-[#875a19]">
          <AlertCircle className="mt-0.5 shrink-0" size={17} />
          {message}
        </div>
      )}
      <button
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d3b2b] px-5 py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            {create ? 'Create farmer account' : 'Sign in securely'}
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  )
}
