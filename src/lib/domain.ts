export type FinancialRecord = {
  type: 'sale' | 'expense' | string
  amount: number
  evidenceStatus?: string
}

export const LOAN_APPLICATION_REQUIREMENTS = {
  financialRecords: 4,
  farmActivities: 3,
  productionHistory: 3,
} as const

export type FarmPerformance = {
  revenue: number
  expenses: number
  profit: number
  salesCount: number
  expenseCount: number
  harvestQuantity: number
  yieldPerUnit: number | null
  losses: number
  productivityScore: number
  profitabilityScore: number
  consistencyScore: number
  overallScore: number
}

export function calculateFarmPerformance(
  profile: Record<string, any> | null,
  records: FinancialRecord[],
  activities: unknown[],
): FarmPerformance {
  const sales = records.filter((record) => record.type === 'sale')
  const expenses = records.filter((record) => record.type === 'expense')
  const revenue = sales.reduce((sum, record) => sum + Number(record.amount || 0), 0)
  const costs = expenses.reduce((sum, record) => sum + Number(record.amount || 0), 0)
  const activityRows = activities as Array<Record<string, any>>
  const harvestRows = activityRows.filter((row) => String(row.type).toLowerCase().includes('harvest'))
  const harvestQuantity = harvestRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0)
  const losses = activityRows.reduce((sum, row) => sum + Number(row.lossQuantity || 0), 0)
  const farmSize = Number(profile?.farmSize || 0)
  const yieldPerUnit = harvestQuantity > 0 && farmSize > 0 ? harvestQuantity / farmSize : null

  const productivityScore = Math.round(
    (harvestRows.length ? 35 : 0) +
    (harvestQuantity > 0 ? 35 : 0) +
    (yieldPerUnit !== null ? 30 : 0),
  )
  const profitabilityScore = revenue <= 0
    ? 0
    : Math.round(Math.min(100, Math.max(0, ((revenue - costs) / revenue) * 100)))
  const consistencyScore = Math.round(
    Math.min(100,
      (sales.length ? 25 : 0) +
      (expenses.length ? 25 : 0) +
      (activityRows.length >= LOAN_APPLICATION_REQUIREMENTS.productionHistory ? 30 : activityRows.length * 10) +
      (records.length >= LOAN_APPLICATION_REQUIREMENTS.financialRecords ? 20 : records.length * 5),
    ),
  )
  const overallScore = Math.round(productivityScore * 0.35 + profitabilityScore * 0.35 + consistencyScore * 0.30)

  return {
    revenue,
    expenses: costs,
    profit: revenue - costs,
    salesCount: sales.length,
    expenseCount: expenses.length,
    harvestQuantity,
    yieldPerUnit,
    losses,
    productivityScore,
    profitabilityScore,
    consistencyScore,
    overallScore,
  }
}

export function loanApplicationReadiness(
  profile: Record<string, any> | null,
  records: FinancialRecord[],
  activities: unknown[],
) {
  const farm = profile ?? {}
  const performance = calculateFarmPerformance(farm, records, activities)
  const hasSales = performance.salesCount > 0
  const hasExpenses = performance.expenseCount > 0
  const profitable = performance.profit > 0
  const projection = Number(farm.projectedRevenue)
  const hasProjection = Number.isFinite(projection) && projection > 0
  const ninLast4 = String(farm.ninLast4 ?? '').replace(/\D/g, '')
  const bankLast4 = String(farm.bankAccountLast4 ?? '').replace(/\D/g, '')
  const hasDocumentSupport = Array.isArray(farm.supportingDocuments) && farm.supportingDocuments.length >= 1
  const checks = [
    { id: 'identity', label: 'Identity and personal details verified', complete: farm.identityVerified === true && /^\d{4}$/.test(ninLast4) && Boolean(farm.fullName) },
    { id: 'location', label: 'Complete farm address (state, LGA and address)', complete: Boolean(farm.state && farm.lga && farm.address) },
    { id: 'farm', label: 'Farm size and crop or livestock production recorded', complete: Number(farm.farmSize) > 0 && Boolean(farm.crops?.length || farm.livestockType) },
    { id: 'production-history', label: `Production history (${LOAN_APPLICATION_REQUIREMENTS.productionHistory} activities)`, complete: activities.length >= LOAN_APPLICATION_REQUIREMENTS.productionHistory },
    { id: 'transactions', label: `Complete financial history (${LOAN_APPLICATION_REQUIREMENTS.financialRecords} records)`, complete: records.length >= LOAN_APPLICATION_REQUIREMENTS.financialRecords },
    { id: 'sales', label: 'At least one recorded sale', complete: hasSales },
    { id: 'expenses', label: 'At least one recorded expense', complete: hasExpenses },
    { id: 'projection', label: 'Realistic, documented financial projection', complete: hasProjection && Boolean(farm.projectionEvidence) },
    { id: 'profitability', label: 'Positive recorded operating profit or repayment capacity', complete: profitable },
    { id: 'bank', label: 'Valid, verified bank account details', complete: farm.bankVerified === true && /^\d{4}$/.test(bankLast4) && Boolean(farm.bankName && farm.bankAccountName) },
    { id: 'documents', label: 'Required supporting documents supplied', complete: hasDocumentSupport },
  ]
  const ready = checks.every((check) => check.complete)
  const score = Math.round((checks.filter((check) => check.complete).length / checks.length) * 100)
  const reasons = ready
    ? ['All required eligibility checks are complete.', 'The application remains subject to sponsor review and independent verification.']
    : checks.filter((check) => !check.complete).map((check) => `${check.label} is incomplete.`)
  const improvements = checks.filter((check) => !check.complete).map((check) => ({
    id: check.id,
    action: {
      identity: 'Request identity verification and provide the required NIN evidence.',
      location: 'Add your full farm address, state and local government area.',
      farm: 'Record farm size and at least one crop or livestock type.',
      'production-history': 'Record planting, production and harvest activities across at least three entries.',
      transactions: 'Record at least four sales or expense entries.',
      sales: 'Add a sale or harvest revenue record.',
      expenses: 'Add farm expenses such as inputs or transport.',
      projection: 'Provide a realistic projected revenue and supporting evidence.',
      profitability: 'Improve the documented operating surplus and repayment capacity.',
      bank: 'Supply and request verification of the required bank account information.',
      documents: 'Supply at least one supporting farm or identity document through the secure process.',
    }[check.id] ?? `Complete ${check.label.toLowerCase()}.`,
  }))

  return {
    ready,
    score,
    checks,
    reasons,
    improvements,
    performance,
    note: 'This transparent readiness assessment is not a credit score or guarantee of financing. Verification decisions require independent review.',
  }
}

export function estimateEqualMonthlyRepayment(principal: number, annualRatePercent: number, months: number) {
  if (principal <= 0 || months <= 0 || annualRatePercent < 0) return null
  if (annualRatePercent === 0) return Math.round(principal * 100) / 100
  const monthlyRate = annualRatePercent / 1200
  const payment = principal * monthlyRate / (1 - (1 + monthlyRate) ** -months)
  return Math.round(payment * months * 100) / 100
}

export function recommendations(profile: Record<string, any>) {
  const now = new Date().toISOString()
  const results = []
  if (!profile.soilType) {
    results.push({
      id: 'soil-baseline',
      category: 'Soil preparation',
      action: 'Arrange a basic soil test before making input decisions.',
      reason: 'Your profile does not yet include soil type or test results.',
      evidence: 'Evidence-informed rule',
      source: 'FAO integrated soil fertility management guidance',
      limitation: 'No exact fertilizer rate is provided without local soil and crop data.',
      createdAt: now,
    })
  }
  if (profile.irrigation === 'none') {
    results.push({
      id: 'rainfall-planning',
      category: 'Water planning',
      action: 'Align planting with the locally observed onset of dependable rainfall.',
      reason: 'The farm is recorded as rain-fed without irrigation.',
      evidence: 'Contextual agronomic rule',
      source: 'FAO crop water management principles',
      limitation: 'Forecasts are uncertain and do not guarantee field conditions.',
      createdAt: now,
    })
  }
  if ((profile.crops ?? []).length > 0) {
    results.push({
      id: 'field-scouting',
      category: 'Risk reduction',
      action: `Inspect ${profile.crops.join(', ')} fields at least weekly and record unusual symptoms.`,
      reason: 'Frequent field observations support earlier expert review.',
      evidence: 'General good agricultural practice',
      source: 'FAO integrated pest management principles',
      limitation: 'This is not a pest or disease diagnosis.',
      createdAt: now,
    })
  }
  return results
}

export function readiness(records: FinancialRecord[], consent: boolean) {
  const sales = records.filter((record) => record.type === 'sale')
  const expenses = records.filter((record) => record.type === 'expense')
  const revenue = sales.reduce((sum, record) => sum + Number(record.amount || 0), 0)
  const costs = expenses.reduce((sum, record) => sum + Number(record.amount || 0), 0)
  const supported = records.filter(
    (record) => record.evidenceStatus === 'document-supported',
  ).length
  const completeness = Math.min(
    100,
    (sales.length > 0 ? 30 : 0) +
      (expenses.length > 0 ? 30 : 0) +
      (records.length >= 4 ? 20 : records.length * 5) +
      (supported > 0 ? 20 : 0),
  )
  return {
    kind: 'financial-readiness',
    predictiveModelEnabled: false,
    validationStatus: 'No lawful historical repayment dataset is configured',
    consentRecorded: consent,
    indicators: {
      totalRecordedRevenue: revenue,
      totalRecordedExpenses: costs,
      operatingSurplus: revenue - costs,
      recordCompleteness: completeness,
      supportedRecords: supported,
    },
    factors: [
      sales.length ? 'Sales history is recorded' : 'No sales records are available',
      expenses.length ? 'Operating expenses are recorded' : 'Expense records are incomplete',
      supported ? 'Some records have document support' : 'All records are farmer-reported',
    ],
    limitations:
      'This is not a credit score, default probability, lender decision, or guarantee of financing.',
    createdAt: new Date().toISOString(),
  }
}