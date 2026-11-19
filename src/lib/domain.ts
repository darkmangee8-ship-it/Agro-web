export type FinancialRecord = {
  type: 'sale' | 'expense' | string
  amount: number
  evidenceStatus?: string
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