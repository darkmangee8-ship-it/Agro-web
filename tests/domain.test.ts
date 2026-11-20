import { describe, expect, it } from 'vitest'
import { estimateEqualMonthlyRepayment, loanApplicationReadiness, readiness, recommendations } from '../src/lib/domain'

describe('financial readiness', () => {
  it('does not invent missing financial values', () => {
    const result = readiness([], false)
    expect(result.indicators.totalRecordedRevenue).toBe(0)
    expect(result.indicators.totalRecordedExpenses).toBe(0)
    expect(result.indicators.recordCompleteness).toBe(0)
    expect(result.predictiveModelEnabled).toBe(false)
    expect(result.consentRecorded).toBe(false)
  })

  it('calculates explicit totals and evidence status', () => {
    const result = readiness(
      [
        { type: 'sale', amount: 150_000, evidenceStatus: 'document-supported' },
        { type: 'expense', amount: 45_000, evidenceStatus: 'farmer-reported' },
      ],
      true,
    )
    expect(result.indicators.totalRecordedRevenue).toBe(150_000)
    expect(result.indicators.totalRecordedExpenses).toBe(45_000)
    expect(result.indicators.operatingSurplus).toBe(105_000)
    expect(result.indicators.supportedRecords).toBe(1)
  })
})

describe('agronomic recommendations', () => {
  it('labels missing soil context and avoids exact input rates', () => {
    const result = recommendations({ crops: ['Maize'], irrigation: 'none' })
    expect(result.map((item) => item.id)).toContain('soil-baseline')
    expect(result.find((item) => item.id === 'soil-baseline')?.limitation).toContain(
      'No exact fertilizer rate',
    )
  })

  it('does not emit missing-data rules when context is supplied', () => {
    const result = recommendations({ soilType: 'Loam', irrigation: 'available', crops: [] })
    expect(result).toHaveLength(0)
  })
})

describe('loan application readiness', () => {
  it('requires complete farm, transaction, and activity records without deciding credit eligibility', () => {
    const records = [
      { type: 'sale', amount: 100 },
      { type: 'sale', amount: 80 },
      { type: 'expense', amount: 25 },
      { type: 'expense', amount: 10 },
    ]
    const result = loanApplicationReadiness(
      {
        state: 'Kaduna', lga: 'Zaria', address: 'Zaria farm road', farmSize: 2,
        crops: ['Maize'], fullName: 'Test Farmer', identityVerified: true, ninLast4: '1234',
        projectedRevenue: 200, projectionEvidence: 'Verified buyer contract',
        bankVerified: true, bankName: 'Test Bank', bankAccountName: 'Test Farmer', bankAccountLast4: '6789',
        supportingDocuments: ['Farm certificate'],
      },
      records,
      [{}, {}, {}],
    )
    expect(result.ready).toBe(true)
    expect(result.note).toContain('not a credit score')
  })

  it('identifies missing application records', () => {
    const result = loanApplicationReadiness(null, [], [])
    expect(result.ready).toBe(false)
    expect(result.checks.filter((check) => !check.complete)).toHaveLength(11)
  })
})

describe('illustrative loan repayment estimate', () => {
  it('handles zero interest and rejects invalid values', () => {
    expect(estimateEqualMonthlyRepayment(120_000, 0, 12)).toBe(120_000)
    expect(estimateEqualMonthlyRepayment(0, 10, 12)).toBeNull()
  })

  it('calculates an amortized estimate with interest', () => {
    expect(estimateEqualMonthlyRepayment(120_000, 12, 12)).toBe(127_942.26)
  })
})
