import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { getDatabase } from '@/lib/db'
import * as schema from '@/lib/db/schema'

const secret = process.env.BETTER_AUTH_SECRET

function createAuth() {
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('BETTER_AUTH_SECRET must be configured in production')
  }

  return betterAuth({
    appName: 'AgroVision AI',
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    secret: secret || 'development-only-secret-change-before-deploying-32-chars',
    trustedOrigins: [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      'http://localhost:3000',
    ].filter((origin): origin is string => Boolean(origin)),
    database: drizzleAdapter(getDatabase(), {
      provider: 'pg',
      schema: {
        ...schema,
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'farmer',
          input: false,
        },
      },
    },
  })
}

let authInstance: ReturnType<typeof createAuth> | undefined

export function getAuth() {
  if (!authInstance) authInstance = createAuth()
  return authInstance
}