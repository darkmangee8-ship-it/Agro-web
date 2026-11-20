import {
  boolean,
  integer,
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

export const sponsorProfiles = pgTable('sponsor_profiles', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  organizationName: text('organization_name').notNull(),
  organizationType: text('organization_type').notNull(),
  approvalStatus: text('approval_status').notNull().default('pending'),
  ...timestamps,
})

export const loanRequests = pgTable('loan_requests', {
  id: text('id').primaryKey(),
  farmerId: text('farmer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sponsorId: text('sponsor_id').references(() => users.id, { onDelete: 'set null' }),
  requestedAmount: numeric('requested_amount', { precision: 16, scale: 2 }).notNull(),
  requestedTermMonths: integer('requested_term_months').notNull(),
  purpose: text('purpose').notNull(),
  repaymentPlan: text('repayment_plan').notNull(),
  applicantDetails: jsonb('applicant_details').$type<Record<string, unknown>>().notNull().default({}),
  supportingDocuments: jsonb('supporting_documents').$type<Array<Record<string, unknown>>>().notNull().default([]),
  sponsorConsentAt: timestamp('sponsor_consent_at', { withTimezone: true }).notNull(),
  sponsorConsent: boolean('sponsor_consent').notNull().default(true),
  status: text('status').notNull().default('submitted'),
  offeredAmount: numeric('offered_amount', { precision: 16, scale: 2 }),
  annualInterestRate: numeric('annual_interest_rate', { precision: 7, scale: 4 }),
  offeredTermMonths: integer('offered_term_months'),
  estimatedTotalRepayment: numeric('estimated_total_repayment', { precision: 16, scale: 2 }),
  sponsorMessage: text('sponsor_message'),
  ...timestamps,
})

export const loanAuditEvents = pgTable('loan_audit_events', {
  id: text('id').primaryKey(),
  loanRequestId: text('loan_request_id').references(() => loanRequests.id, { onDelete: 'set null' }),
  actorId: text('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})