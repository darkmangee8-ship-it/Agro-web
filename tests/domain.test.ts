import { describe, expect, it } from 'vitest'
import { readiness, recommendations } from '../src/lib/domain'

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
