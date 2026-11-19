import {
  boolean,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('farmer'),
  ...timestamps,
})

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  ...timestamps,
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
})

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  ...timestamps,
})

export const verifications = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps,
})

export const farmProfiles = pgTable('farm_profiles', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  profile: jsonb('profile').$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
})

export const farmActivities = pgTable('farm_activities', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activity: jsonb('activity').$type<Record<string, unknown>>().notNull(),
  ...timestamps,
})

export const financialRecords = pgTable('financial_records', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  amount: numeric('amount', { precision: 16, scale: 2 }).notNull(),
  record: jsonb('record').$type<Record<string, unknown>>().notNull(),
  ...timestamps,
})

export const marketPrices = pgTable('market_prices', {
  id: text('id').primaryKey(),
  commodity: text('commodity').notNull(),
  market: text('market').notNull(),
  state: text('state').notNull().default(''),
  price: numeric('price', { precision: 16, scale: 2 }).notNull(),
  unit: text('unit').notNull(),
  observationDate: text('observation_date').notNull(),
  source: text('source').notNull(),
  verificationStatus: text('verification_status').notNull(),
  retrievedAt: timestamp('retrieved_at', { withTimezone: true }).notNull().defaultNow(),
})