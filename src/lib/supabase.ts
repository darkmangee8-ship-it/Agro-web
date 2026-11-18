'use client'

import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

export const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey)

export const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-c6ad5cab`

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error ?? 'Request failed')
  return payload as T
}
