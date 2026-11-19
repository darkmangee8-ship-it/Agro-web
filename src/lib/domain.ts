export type FinancialRecord = {
  type: 'sale' | 'expense' | string
  amount: number
  evidenceStatus?: string
}

export const LOAN_APPLICATION_REQUIREMENTS = {
  financialRecords: 4,
  farmActivities: 3,
} as const

export function loanApplicationReadiness(
  profile: Record<string, any> | null,
  records: FinancialRecord[],
  activities: unknown[],
) {
  const farm = profile ?? {}
  const hasSales = records.some((record) => record.type === 'sale')
  const hasExpenses = records.some((record) => record.type === 'expense')
  const checks = [
    { id: 'location', label: 'Farm state and local government area', complete: Boolean(farm.state && farm.lga) },
    { id: 'farm', label: 'Farm size greater than zero hectares or acres', complete: Number(farm.farmSize) > 0 },
    { id: 'crops', label: 'At least one crop recorded', complete: Array.isArray(farm.crops) && farm.crops.length > 0 },
    { id: 'transactions', label: `At least ${LOAN_APPLICATION_REQUIREMENTS.financialRecords} sales/expense records`, complete: records.length >= LOAN_APPLICATION_REQUIREMENTS.financialRecords },
    { id: 'sales', label: 'At least one sale recorded', complete: hasSales },
    { id: 'expenses', label: 'At least one expense recorded', complete: hasExpenses },
    { id: 'activities', label: `At least ${LOAN_APPLICATION_REQUIREMENTS.farmActivities} farm activities`, complete: activities.length >= LOAN_APPLICATION_REQUIREMENTS.farmActivities },
  ]
  return {
    ready: checks.every((check) => check.complete),
    checks,
    note: 'This checklist measures application completeness only. It is not a credit score, loan eligibility decision, approval, or guarantee of financing. A participating lender makes an independent, human-reviewed decision.',
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