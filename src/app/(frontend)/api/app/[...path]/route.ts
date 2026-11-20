import { and, desc, eq, inArray, or } from 'drizzle-orm'
import { getAuth } from '@/lib/auth'
import { getDatabase } from '@/lib/db'
import { farmActivities, farmProfiles, financialRecords, loanAuditEvents, loanRequests, marketPrices, sponsorProfiles, users } from '@/lib/db/schema'
import { estimateEqualMonthlyRepayment, loanApplicationReadiness, readiness, recommendations } from '@/lib/domain'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ path: string[] }> }
type Session = { user: { id: string; email: string; role?: string } }

function json(data: unknown, status = 200) {
  return Response.json(data, { status })
}

async function getSession(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (!session) return null
  const [user] = await getDatabase().select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      role: user?.role,
    },
  } satisfies Session
}

async function bodyOf(request: Request) {
  try {
    return await request.json()
  } catch {
    throw new Error('Request body must be valid JSON')
  }
}

function ownedProfile(session: Session) {
  return getDatabase().query.farmProfiles.findFirst({
    where: eq(farmProfiles.userId, session.user.id),
  })
}

async function route(request: Request, context: RouteContext) {
  const { path } = await context.params
  const endpoint = path.join('/')
  const method = request.method.toUpperCase()

  if (endpoint === 'health' && method === 'GET') {
    return json({ status: 'ok', service: 'AgroVision AI API', weatherProvider: 'Open-Meteo', creditModel: 'disabled' })
  }

  const session = await getSession(request)
  if (!session) return json({ error: 'Authentication required' }, 401)
  const db = getDatabase()
  const userId = session.user.id

  if (endpoint === 'bootstrap' && method === 'GET') {
    const [profileRow, activityRows, financialRows] = await Promise.all([
      ownedProfile(session),
      db.select().from(farmActivities).where(eq(farmActivities.ownerId, userId)).orderBy(desc(farmActivities.createdAt)),
      db.select().from(financialRecords).where(eq(financialRecords.ownerId, userId)).orderBy(desc(financialRecords.createdAt)),
    ])
    const profile = profileRow?.profile ?? null
    const activities = activityRows.map((row) => row.activity)
    const financial = financialRows.map((row) => row.record)
    return json({
      user: { id: userId, email: session.user.email, role: session.user.role ?? 'farmer' },
      profile,
      activities,
      financial,
      notifications: [],
      savedMarkets: [],
      recommendations: recommendations(profile ?? {}),
      assessment: readiness(financial as Parameters<typeof readiness>[0], Boolean(profile?.financialConsent)),
      loanReadiness: loanApplicationReadiness(profile as Record<string, any> | null, financial as Parameters<typeof readiness>[0], activities),
    })
  }

  if (endpoint === 'sponsor-profile' && method === 'POST') {
    const body = await bodyOf(request)
    const organizationName = typeof body?.organizationName === 'string' ? body.organizationName.trim() : ''
    const organizationType = typeof body?.organizationType === 'string' ? body.organizationType : ''
    if (session.user.role !== 'farmer' || organizationName.length < 2 || organizationName.length > 160 || !['bank', 'microfinance', 'cooperative', 'other'].includes(organizationType)) {
      return json({ error: 'Provide a valid organization name and type. Organization access requires administrator review.' }, 400)
    }
    const item = { userId, organizationName, organizationType, approvalStatus: 'pending' }
    await db.insert(sponsorProfiles).values(item).onConflictDoUpdate({
      target: sponsorProfiles.userId,
      set: { organizationName, organizationType, approvalStatus: 'pending', updatedAt: new Date() },
    })
    await db.insert(loanAuditEvents).values({ id: crypto.randomUUID(), actorId: userId, eventType: 'sponsor_application_submitted', metadata: { organizationType } })
    return json({ status: 'pending' }, 201)
  }

  if (endpoint === 'sponsor/status' && method === 'GET') {
    const [organization] = await db.select({ organizationName: sponsorProfiles.organizationName, organizationType: sponsorProfiles.organizationType, approvalStatus: sponsorProfiles.approvalStatus })
      .from(sponsorProfiles).where(eq(sponsorProfiles.userId, userId)).limit(1)
    return json({ role: session.user.role ?? 'farmer', organization: organization ?? null })
  }

  if (endpoint === 'loans' && method === 'GET') {
    const rows = await db.select().from(loanRequests).where(eq(loanRequests.farmerId, userId)).orderBy(desc(loanRequests.createdAt))
    return json({ items: rows })
  }

  if (endpoint === 'loans' && method === 'POST') {
    if (session.user.role !== 'farmer') return json({ error: 'Farmer account required' }, 403)
    const body = await bodyOf(request)
    const [profileRow, recordRows, activityRows] = await Promise.all([
      ownedProfile(session),
      db.select({ record: financialRecords.record }).from(financialRecords).where(eq(financialRecords.ownerId, userId)),
      db.select({ activity: farmActivities.activity }).from(farmActivities).where(eq(farmActivities.ownerId, userId)),
    ])
    const eligibility = loanApplicationReadiness(profileRow?.profile as Record<string, any> | null, recordRows.map((row) => row.record) as Parameters<typeof readiness>[0], activityRows.map((row) => row.activity))
    if (!eligibility.ready) return json({ error: 'Complete the application record requirements before applying.', eligibility }, 400)
    const amount = Number(body?.requestedAmount)
    const term = Number(body?.requestedTermMonths)
    const purpose = typeof body?.purpose === 'string' ? body.purpose.trim() : ''
    const repaymentPlan = typeof body?.repaymentPlan === 'string' ? body.repaymentPlan.trim() : ''
    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : ''
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
    const farmAddress = typeof body?.farmAddress === 'string' ? body.farmAddress.trim() : ''
    const ninLast4 = typeof body?.ninLast4 === 'string' ? body.ninLast4.replace(/\D/g, '').slice(-4) : ''
    const bankAccountName = typeof body?.bankAccountName === 'string' ? body.bankAccountName.trim() : ''
    const bankName = typeof body?.bankName === 'string' ? body.bankName.trim() : ''
    const bankAccountLast4 = typeof body?.bankAccountLast4 === 'string' ? body.bankAccountLast4.replace(/\D/g, '').slice(-4) : ''
    const documents = Array.isArray(body?.supportingDocuments)
      ? body.supportingDocuments.slice(0, 10).filter((item: unknown) => typeof item === 'string' && item.trim()).slice(0, 10).map((name: string) => ({ name: name.trim().slice(0, 200), status: 'farmer-supplied', collectedAt: new Date().toISOString() }))
      : []
    if (!Number.isFinite(amount) || amount <= 0 || amount > 99999999999999 || !Number.isInteger(term) || term < 1 || term > 60 || purpose.length < 10 || purpose.length > 1000 || repaymentPlan.length < 10 || repaymentPlan.length > 1000 || body?.shareWithSponsors !== true) {
      return json({ error: 'Enter a valid amount, 1–60 month term, loan purpose and repayment plan, and explicitly consent to sharing this application with approved sponsors.' }, 400)
    }
    if (fullName.length < 2 || phone.length < 7 || phone.length > 30 || farmAddress.length < 5 || !/^\d{4}$/.test(ninLast4) || bankAccountName.length < 2 || bankName.length < 2 || !/^\d{4}$/.test(bankAccountLast4) || documents.length < 1) {
      return json({ error: 'Provide personal details, the last four digits of NIN and bank account, and at least one supporting document reference.' }, 400)
    }
    const applicantDetails = {
      fullName,
      phone,
      farmAddress,
      ninLast4,
      bankAccountName,
      bankName,
      bankAccountLast4,
      dataConsent: true,
    }
    const id = crypto.randomUUID()
    await db.insert(loanRequests).values({
      id, farmerId: userId, requestedAmount: String(amount), requestedTermMonths: term,
      purpose, repaymentPlan, applicantDetails, supportingDocuments: documents,
      sponsorConsentAt: new Date(), sponsorConsent: true, status: 'submitted',
    })
    await db.insert(loanAuditEvents).values({ id: crypto.randomUUID(), loanRequestId: id, actorId: userId, eventType: 'loan_application_submitted', metadata: { requestedAmount: amount, requestedTermMonths: term, supportingDocumentCount: documents.length } })
    return json({ id, status: 'submitted' }, 201)
  }

  const respondMatch = endpoint.match(/^loans\/([^/]+)\/respond$/)
  if (respondMatch && method === 'PATCH') {
    const body = await bodyOf(request)
    if (!['accepted', 'declined'].includes(body?.response)) return json({ error: 'Choose accept or decline for this offer' }, 400)
    const [requestRow] = await db.select().from(loanRequests).where(and(eq(loanRequests.id, respondMatch[1]), eq(loanRequests.farmerId, userId), eq(loanRequests.status, 'offer_made'))).limit(1)
    if (!requestRow) return json({ error: 'Loan offer not found' }, 404)
    await db.update(loanRequests).set({ status: body.response, updatedAt: new Date() }).where(eq(loanRequests.id, requestRow.id))
    await db.insert(loanAuditEvents).values({ id: crypto.randomUUID(), loanRequestId: requestRow.id, actorId: userId, eventType: `offer_${body.response}`, metadata: {} })
    return json({ status: body.response })
  }

  if (endpoint === 'sponsor/opportunities' && method === 'GET') {
    if (session.user.role !== 'sponsor') return json({ error: 'Approved sponsor access is required' }, 403)
    const [organization] = await db.select().from(sponsorProfiles).where(and(eq(sponsorProfiles.userId, userId), eq(sponsorProfiles.approvalStatus, 'approved'))).limit(1)
    if (!organization) return json({ error: 'Sponsor organization approval is required' }, 403)
    const rows = await db.select({
      request: loanRequests,
      farmerName: users.name,
      profile: farmProfiles.profile,
    }).from(loanRequests)
      .innerJoin(users, eq(users.id, loanRequests.farmerId))
      .leftJoin(farmProfiles, eq(farmProfiles.userId, loanRequests.farmerId))
      .where(and(eq(loanRequests.sponsorConsent, true), or(inArray(loanRequests.status, ['submitted', 'reviewed']), and(eq(loanRequests.sponsorId, userId), inArray(loanRequests.status, ['offer_made', 'accepted', 'declined'])))))
      .orderBy(desc(loanRequests.createdAt))
    const items = await Promise.all(rows.map(async ({ request: item, farmerName, profile }) => {
      const [records, activities] = await Promise.all([
        db.select({ record: financialRecords.record }).from(financialRecords).where(eq(financialRecords.ownerId, item.farmerId)),
        db.select({ activity: farmActivities.activity }).from(farmActivities).where(eq(farmActivities.ownerId, item.farmerId)),
      ])
      const recordValues = records.map((row) => row.record)
      const activityValues = activities.map((row) => row.activity)
      const assessment = readiness(recordValues as Parameters<typeof readiness>[0], true)
      const eligibility = loanApplicationReadiness(profile as Record<string, any> | null, recordValues as Parameters<typeof readiness>[0], activityValues)
      const farm = profile ?? {}
      await db.insert(loanAuditEvents).values({ id: crypto.randomUUID(), loanRequestId: item.id, actorId: userId, eventType: 'sponsor_viewed_application', metadata: {} })
      return {
        id: item.id, status: item.status, requestedAmount: item.requestedAmount,
        requestedTermMonths: item.requestedTermMonths, purpose: item.purpose,
        repaymentPlan: item.repaymentPlan, createdAt: item.createdAt,
        offeredAmount: item.offeredAmount, annualInterestRate: item.annualInterestRate,
        offeredTermMonths: item.offeredTermMonths, estimatedTotalRepayment: item.estimatedTotalRepayment,
        estimatedInterest: item.estimatedTotalRepayment && item.offeredAmount ? (Number(item.estimatedTotalRepayment) - Number(item.offeredAmount)).toFixed(2) : null,
        sponsorMessage: item.sponsorMessage,
        farmer: { name: farmerName, farmName: farm.farmName, state: farm.state, lga: farm.lga, farmSize: farm.farmSize, farmSizeUnit: farm.farmSizeUnit, crops: Array.isArray(farm.crops) ? farm.crops : [] },
        records: { revenue: assessment.indicators.totalRecordedRevenue, expenses: assessment.indicators.totalRecordedExpenses, operatingSurplus: assessment.indicators.operatingSurplus, count: records.length },
        eligibility,
        performance: eligibility.performance,
        applicantDetails: item.applicantDetails,
        supportingDocuments: item.supportingDocuments,
      }
    }))
    return json({ organization: organization.organizationName, items })
  }

  const sponsorOfferMatch = endpoint.match(/^sponsor\/opportunities\/([^/]+)\/offer$/)
  if (sponsorOfferMatch && method === 'POST') {
    if (session.user.role !== 'sponsor') return json({ error: 'Approved sponsor access is required' }, 403)
    const [organization] = await db.select().from(sponsorProfiles).where(and(eq(sponsorProfiles.userId, userId), eq(sponsorProfiles.approvalStatus, 'approved'))).limit(1)
    if (!organization) return json({ error: 'Sponsor organization approval is required' }, 403)
    const body = await bodyOf(request)
    const [loan] = await db.select().from(loanRequests).where(and(eq(loanRequests.id, sponsorOfferMatch[1]), eq(loanRequests.sponsorConsent, true), inArray(loanRequests.status, ['submitted', 'reviewed']))).limit(1)
    const amount = Number(body?.offeredAmount)
    const rate = Number(body?.annualInterestRate)
    const term = Number(body?.offeredTermMonths)
    const message = typeof body?.sponsorMessage === 'string' ? body.sponsorMessage.trim().slice(0, 1000) : ''
    if (!loan) return json({ error: 'This application is no longer available' }, 404)
    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(loan.requestedAmount) || !Number.isFinite(rate) || rate < 0 || rate > 100 || !Number.isInteger(term) || term < 1 || term > 60) {
      return json({ error: 'Offer must include a positive amount no greater than requested, an annual rate from 0–100%, and a 1–60 month term' }, 400)
    }
    const total = estimateEqualMonthlyRepayment(amount, rate, term)
    const [updatedLoan] = await db.update(loanRequests).set({
      sponsorId: userId, status: 'offer_made', offeredAmount: String(amount),
      annualInterestRate: String(rate), offeredTermMonths: term,
      estimatedTotalRepayment: total === null ? null : String(total), sponsorMessage: message, updatedAt: new Date(),
    }).where(and(eq(loanRequests.id, loan.id), eq(loanRequests.sponsorConsent, true), inArray(loanRequests.status, ['submitted', 'reviewed']))).returning({ id: loanRequests.id })
    if (!updatedLoan) return json({ error: 'This application was withdrawn or has already received an offer' }, 409)
    await db.insert(loanAuditEvents).values({ id: crypto.randomUUID(), loanRequestId: loan.id, actorId: userId, eventType: 'sponsor_offer_made', metadata: { offeredAmount: amount, annualInterestRate: rate, offeredTermMonths: term } })
    return json({ status: 'offer_made', estimatedTotalRepayment: total })
  }

  const sponsorDecisionMatch = endpoint.match(/^sponsor\/opportunities\/([^/]+)\/decision$/)
  if (sponsorDecisionMatch && method === 'POST') {
    if (session.user.role !== 'sponsor') return json({ error: 'Approved sponsor access is required' }, 403)
    const [organization] = await db.select().from(sponsorProfiles).where(and(eq(sponsorProfiles.userId, userId), eq(sponsorProfiles.approvalStatus, 'approved'))).limit(1)
    if (!organization) return json({ error: 'Sponsor organization approval is required' }, 403)
    const body = await bodyOf(request)
    const decision = body?.decision
    const feedback = typeof body?.feedback === 'string' ? body.feedback.trim().slice(0, 1000) : ''
    if (!['approved', 'rejected'].includes(decision) || feedback.length < 5) {
      return json({ error: 'Choose approved or rejected and provide feedback of at least five characters.' }, 400)
    }
    const [loan] = await db.select().from(loanRequests).where(and(eq(loanRequests.id, sponsorDecisionMatch[1]), eq(loanRequests.sponsorConsent, true), inArray(loanRequests.status, ['submitted', 'reviewed']))).limit(1)
    if (!loan) return json({ error: 'This application is no longer available' }, 404)
    const status = decision === 'approved' ? 'approved' : 'declined'
    await db.update(loanRequests).set({ sponsorId: userId, status, sponsorMessage: feedback, updatedAt: new Date() }).where(eq(loanRequests.id, loan.id))
    await db.insert(loanAuditEvents).values({ id: crypto.randomUUID(), loanRequestId: loan.id, actorId: userId, eventType: `sponsor_application_${status}`, metadata: { feedback } })
    return json({ status, feedback })
  }

  if (endpoint === 'admin/lending' && method === 'GET') {
    if (session.user.role !== 'admin') return json({ error: 'Administrator role required' }, 403)
    const [farmers, organizations, applications] = await Promise.all([
      db.select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt, profile: farmProfiles.profile }).from(users).leftJoin(farmProfiles, eq(farmProfiles.userId, users.id)).where(eq(users.role, 'farmer')).orderBy(desc(users.createdAt)),
      db.select({ profile: sponsorProfiles, userName: users.name, email: users.email }).from(sponsorProfiles).innerJoin(users, eq(users.id, sponsorProfiles.userId)).orderBy(desc(sponsorProfiles.createdAt)),
      db.select({ request: loanRequests, userName: users.name, email: users.email }).from(loanRequests).innerJoin(users, eq(users.id, loanRequests.farmerId)).orderBy(desc(loanRequests.createdAt)),
    ])
    const farmerIds = farmers.map((farmer) => farmer.id)
    const [farmerRecords, farmerActivities] = farmerIds.length ? await Promise.all([
      db.select({ ownerId: financialRecords.ownerId, record: financialRecords.record }).from(financialRecords).where(inArray(financialRecords.ownerId, farmerIds)),
      db.select({ ownerId: farmActivities.ownerId }).from(farmActivities).where(inArray(farmActivities.ownerId, farmerIds)),
    ]) : [[], []]
    const farmerSummaries = farmers.map(({ profile, ...farmer }) => {
      const records = farmerRecords.filter((row) => row.ownerId === farmer.id).map((row) => row.record)
      const assessment = readiness(records as Parameters<typeof readiness>[0], false)
      const farm = profile ?? {}
      return {
        ...farmer,
        farm: { farmName: farm.farmName, state: farm.state, lga: farm.lga, farmSize: farm.farmSize, farmSizeUnit: farm.farmSizeUnit, crops: Array.isArray(farm.crops) ? farm.crops : [] },
        recordSummary: { financialRecordCount: records.length, activityCount: farmerActivities.filter((row) => row.ownerId === farmer.id).length, revenue: assessment.indicators.totalRecordedRevenue, expenses: assessment.indicators.totalRecordedExpenses, operatingSurplus: assessment.indicators.operatingSurplus },
      }
    })
    await db.insert(loanAuditEvents).values({ id: crypto.randomUUID(), actorId: userId, eventType: 'admin_viewed_lending_dashboard', metadata: { farmerCount: farmers.length, applicationCount: applications.length } })
    return json({ farmers: farmerSummaries, organizations: organizations.map(({ profile, ...rest }) => ({ ...rest, ...profile })), applications: applications.map(({ request: item, ...farmer }) => ({ ...item, farmer })) })
  }

  const adminLoanMatch = endpoint.match(/^admin\/loans\/([^/]+)$/)
  if (adminLoanMatch && method === 'PATCH') {
    if (session.user.role !== 'admin') return json({ error: 'Administrator role required' }, 403)
    const body = await bodyOf(request)
    const decision = body?.decision
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 1000) : ''
    if (!['reviewed', 'declined'].includes(decision) || reason.length < 5) return json({ error: 'Choose reviewed or declined and provide a review note of at least five characters' }, 400)
    const [item] = await db.select().from(loanRequests).where(eq(loanRequests.id, adminLoanMatch[1])).limit(1)
    if (!item || !['submitted', 'reviewed'].includes(item.status)) return json({ error: 'Application is not available for administrator review' }, 404)
    await db.update(loanRequests).set({ status: decision, updatedAt: new Date() }).where(eq(loanRequests.id, item.id))
    await db.insert(loanAuditEvents).values({ id: crypto.randomUUID(), loanRequestId: item.id, actorId: userId, eventType: `admin_${decision}`, metadata: { reason } })
    return json({ status: decision })
  }

  const withdrawMatch = endpoint.match(/^loans\/([^/]+)\/withdraw$/)
  if (withdrawMatch && method === 'PATCH') {
    const [item] = await db.select().from(loanRequests).where(and(eq(loanRequests.id, withdrawMatch[1]), eq(loanRequests.farmerId, userId))).limit(1)
    if (!item || item.status === 'withdrawn') return json({ error: 'This application can no longer be withdrawn' }, 404)
    await db.update(loanRequests).set({ status: ['submitted', 'reviewed', 'offer_made'].includes(item.status) ? 'withdrawn' : item.status, sponsorConsent: false, updatedAt: new Date() }).where(eq(loanRequests.id, item.id))
    await db.insert(loanAuditEvents).values({ id: crypto.randomUUID(), loanRequestId: item.id, actorId: userId, eventType: 'farmer_withdrew_application', metadata: {} })
    return json({ status: 'withdrawn' })
  }

  const sponsorReviewMatch = endpoint.match(/^admin\/sponsors\/([^/]+)$/)
  if (sponsorReviewMatch && method === 'PATCH') {
    if (session.user.role !== 'admin') return json({ error: 'Administrator role required' }, 403)
    const body = await bodyOf(request)
    if (!['approved', 'rejected'].includes(body?.decision)) return json({ error: 'Choose approved or rejected' }, 400)
    const [organization] = await db.select().from(sponsorProfiles).where(eq(sponsorProfiles.userId, sponsorReviewMatch[1])).limit(1)
    if (!organization || organization.approvalStatus !== 'pending') return json({ error: 'Pending sponsor application not found' }, 404)
    const role = body.decision === 'approved' ? 'sponsor' : 'farmer'
    await db.transaction(async (tx) => {
      await tx.update(sponsorProfiles).set({ approvalStatus: body.decision, updatedAt: new Date() }).where(eq(sponsorProfiles.userId, organization.userId))
      await tx.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, organization.userId))
      await tx.insert(loanAuditEvents).values({ id: crypto.randomUUID(), actorId: userId, eventType: `sponsor_${body.decision}`, metadata: { sponsorUserId: organization.userId } })
    })
    return json({ status: body.decision, role })
  }

  if (endpoint === 'profile' && method === 'PUT') {
    if (session.user.role !== 'farmer') return json({ error: 'Farmer account required' }, 403)
    const body = await bodyOf(request)
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Profile must be an object' }, 400)
    const allowed = [
      'fullName', 'farmName', 'state', 'lga', 'latitude', 'longitude', 'farmSize', 'farmSizeUnit',
      'crops', 'livestockType', 'soilType', 'irrigation', 'farmingMethod', 'plantingDate', 'expectedHarvestDate',
      'address', 'projectedRevenue', 'projectionEvidence', 'ninLast4', 'bankAccountName',
      'bankAccountLast4', 'bankName', 'supportingDocuments', 'financialConsent',
    ]
    const profile: Record<string, unknown> = { ...(await ownedProfile(session))?.profile }
    for (const field of allowed) if (Object.hasOwn(body, field)) profile[field] = body[field]
    if (profile.farmSize !== undefined && Number(profile.farmSize) < 0) return json({ error: 'Farm size cannot be negative' }, 400)
    if (profile.latitude != null && (!Number.isFinite(Number(profile.latitude)) || Number(profile.latitude) < -90 || Number(profile.latitude) > 90)) {
      return json({ error: 'Latitude must be between -90 and 90' }, 400)
    }
    if (profile.longitude != null && (!Number.isFinite(Number(profile.longitude)) || Number(profile.longitude) < -180 || Number(profile.longitude) > 180)) {
      return json({ error: 'Longitude must be between -180 and 180' }, 400)
    }
    await db.insert(farmProfiles).values({ userId, profile }).onConflictDoUpdate({
      target: farmProfiles.userId,
      set: { profile, updatedAt: new Date() },
    })
    return json({ profile, recommendations: recommendations(profile) })
  }

  if (endpoint === 'activities' && method === 'GET') {
    const items = await db.select({ activity: farmActivities.activity }).from(farmActivities)
      .where(eq(farmActivities.ownerId, userId)).orderBy(desc(farmActivities.createdAt))
    return json({ items: items.map((item) => item.activity) })
  }

  if (endpoint === 'activities' && method === 'POST') {
    if (session.user.role !== 'farmer') return json({ error: 'Farmer account required' }, 403)
    const body = await bodyOf(request)
    if (!body?.type || !body?.date) return json({ error: 'Activity type and date are required' }, 400)
    const item = {
      id: crypto.randomUUID(),
      type: String(body.type).slice(0, 50),
      date: String(body.date),
      crop: String(body.crop ?? '').slice(0, 80),
      quantity: Number(body.quantity || 0),
      unit: String(body.unit ?? '').slice(0, 20),
      lossQuantity: Number(body.lossQuantity || 0),
      notes: String(body.notes ?? '').slice(0, 500),
      createdAt: new Date().toISOString(),
    }
    await db.insert(farmActivities).values({ id: item.id, ownerId: userId, activity: item })
    return json({ item }, 201)
  }

  if (endpoint === 'financial' && method === 'POST') {
    if (session.user.role !== 'farmer') return json({ error: 'Farmer account required' }, 403)
    const body = await bodyOf(request)
    const amount = Number(body?.amount)
    if (!['sale', 'expense'].includes(body?.type) || !Number.isFinite(amount) || amount <= 0) {
      return json({ error: 'Enter a valid sale or expense amount' }, 400)
    }
    const item = {
      id: crypto.randomUUID(),
      type: body.type,
      amount,
      currency: 'NGN',
      date: String(body.date ?? new Date().toISOString().slice(0, 10)),
      category: String(body.category ?? '').slice(0, 100),
      evidenceStatus: body.evidenceStatus === 'document-supported' ? 'document-supported' : 'farmer-reported',
      createdAt: new Date().toISOString(),
    }
    await db.insert(financialRecords).values({
      id: item.id,
      ownerId: userId,
      type: item.type,
      amount: String(item.amount),
      record: item,
    })
    const rows = await db.select({ record: financialRecords.record }).from(financialRecords)
      .where(eq(financialRecords.ownerId, userId))
    const profile = (await ownedProfile(session))?.profile
    return json({ item, assessment: readiness(rows.map((row) => row.record) as Parameters<typeof readiness>[0], Boolean(profile?.financialConsent)) }, 201)
  }

  if (endpoint === 'weather' && method === 'GET') {
    const profile = (await ownedProfile(session))?.profile
    const url = new URL(request.url)
    const latitude = Number(url.searchParams.get('lat') ?? profile?.latitude)
    const longitude = Number(url.searchParams.get('lng') ?? profile?.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return json({ error: 'Add valid farm coordinates to view local weather' }, 400)
    }
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast')
    weatherUrl.search = new URLSearchParams({
      latitude: String(latitude), longitude: String(longitude),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
      hourly: 'temperature_2m,precipitation_probability,precipitation,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
      timezone: 'Africa/Lagos', forecast_days: '7',
    }).toString()
    const response = await fetch(weatherUrl, { signal: AbortSignal.timeout(9000), cache: 'no-store' })
    if (!response.ok) return json({ error: 'Weather provider is temporarily unavailable' }, 502)
    const data = await response.json()
    const alerts: Array<Record<string, string>> = []
    if (Math.max(...(data.daily?.precipitation_sum ?? [0])) >= 40) alerts.push({ severity: 'high', trigger: 'Forecast rainfall ≥ 40 mm/day', precaution: 'Inspect drainage and avoid scheduling harvest during the affected period.' })
    if (Math.max(...(data.daily?.temperature_2m_max ?? [0])) >= 38) alerts.push({ severity: 'medium', trigger: 'Forecast temperature ≥ 38°C', precaution: 'Review crop water stress and schedule field work for cooler hours.' })
    if (Math.max(...(data.daily?.wind_speed_10m_max ?? [0])) >= 35) alerts.push({ severity: 'medium', trigger: 'Forecast wind ≥ 35 km/h', precaution: 'Secure light equipment and review exposed crops.' })
    return json({
      ...data,
      alerts: alerts.map((alert) => ({ ...alert, kind: 'forecast', source: 'Open-Meteo', createdAt: new Date().toISOString(), limitation: 'A forecast is not a confirmed event or guarantee of crop loss.' })),
      attribution: 'Weather data by Open-Meteo', retrievedAt: new Date().toISOString(),
    })
  }

  if (endpoint === 'markets' && method === 'GET') {
    const rows = await db.select().from(marketPrices).orderBy(desc(marketPrices.retrievedAt))
    const items = rows.map(({ retrievedAt, ...row }) => ({ ...row, retrievedAt: retrievedAt.toISOString() }))
    return json({
      items,
      status: items.length ? 'available' : 'unavailable',
      message: items.length ? undefined : 'No verified Nigerian market price source has been imported. Live prices are not fabricated.',
      forecastingSupported: false,
    })
  }

  if (endpoint === 'markets/import' && method === 'POST') {
    if (session.user.role !== 'admin') return json({ error: 'Administrator role required' }, 403)
    const body = await bodyOf(request)
    const rows = Array.isArray(body?.rows) ? body.rows.slice(0, 5000) : []
    const errors: Array<{ row: number; message: string }> = []
    const valid = rows.flatMap((row: Record<string, unknown>, index: number) => {
      if (!row.commodity || !row.market || !Number.isFinite(Number(row.price)) || Number(row.price) <= 0 || !row.unit || !row.observationDate || !row.source) {
        errors.push({ row: index + 1, message: 'Commodity, market, positive price, unit, date and source are required' })
        return []
      }
      return [{
        id: crypto.randomUUID(), commodity: String(row.commodity).slice(0, 120),
        market: String(row.market).slice(0, 120), state: String(row.state ?? '').slice(0, 80),
        price: String(Number(row.price)), unit: String(row.unit).slice(0, 40),
        observationDate: String(row.observationDate).slice(0, 30), source: String(row.source).slice(0, 500),
        verificationStatus: 'admin-verified', retrievedAt: new Date(),
      }]
    })
    await db.transaction(async (tx) => {
      await tx.delete(marketPrices)
      if (valid.length) await tx.insert(marketPrices).values(valid)
    })
    return json({ accepted: valid.length, rejected: errors.length, errors })
  }

  const notificationMatch = endpoint.match(/^notifications\/([^/]+)$/)
  if (notificationMatch && method === 'PATCH') return json({ ok: true })
  return json({ error: 'Not found' }, 404)
}

async function handler(request: Request, context: RouteContext) {
  try {
    return await route(request, context)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status = message === 'Request body must be valid JSON' ? 400 : 500
    if (status === 500) console.error('AgroVision API request failed:', error)
    return json({ error: status === 500 ? 'Request failed' : message }, status)
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler