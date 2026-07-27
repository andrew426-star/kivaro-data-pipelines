import { MARKET_VALUE_TOLERANCE_PCT, PRICE_TOLERANCE_PCT, QUANTITY_TOLERANCE_PCT } from "@/lib/pipeline/tolerance"
import type { CrossSourceStatus, CrossSourceValidationRow, NormalizedHolding, SourceId } from "@/lib/pipeline/types"

const ALL_SOURCE_IDS: SourceId[] = ["custodian_export", "market_data_feed", "analyst_spreadsheet"]

function maxSpreadPct(values: number[]): number {
  if (values.length < 2) return 0
  const max = Math.max(...values)
  const min = Math.min(...values)
  if (max === 0) return 0
  return ((max - min) / max) * 100
}

export function validateCrossSource(holdings: NormalizedHolding[]): CrossSourceValidationRow[] {
  const bySymbol = new Map<string, NormalizedHolding[]>()
  for (const h of holdings) {
    const list = bySymbol.get(h.symbol) ?? []
    list.push(h)
    bySymbol.set(h.symbol, list)
  }

  const rows: CrossSourceValidationRow[] = []

  for (const [symbol, entries] of bySymbol) {
    const bySource: Partial<Record<SourceId, NormalizedHolding>> = {}
    for (const e of entries) bySource[e.sourceId] = e

    const sourcesPresent = ALL_SOURCE_IDS.filter((id) => bySource[id])
    const sourcesMissing = ALL_SOURCE_IDS.filter((id) => !bySource[id])

    const quantities = sourcesPresent.map((id) => bySource[id]!.quantity)
    const prices = sourcesPresent.map((id) => bySource[id]!.price)
    const marketValues = sourcesPresent.map((id) => bySource[id]!.marketValue)

    const quantitySpreadPct = sourcesPresent.length >= 2 ? maxSpreadPct(quantities) : null
    const priceSpreadPct = sourcesPresent.length >= 2 ? maxSpreadPct(prices) : null
    const marketValueSpreadPct = sourcesPresent.length >= 2 ? maxSpreadPct(marketValues) : null

    let status: CrossSourceStatus = "matched"
    if (quantitySpreadPct !== null && quantitySpreadPct > QUANTITY_TOLERANCE_PCT) {
      status = "quantity_mismatch"
    } else if (priceSpreadPct !== null && priceSpreadPct > PRICE_TOLERANCE_PCT) {
      status = "price_mismatch"
    } else if (marketValueSpreadPct !== null && marketValueSpreadPct > MARKET_VALUE_TOLERANCE_PCT) {
      status = "market_value_mismatch"
    } else if (sourcesMissing.length > 0) {
      status = "partial_coverage"
    }

    rows.push({
      symbol,
      name: entries[0].name,
      assetClass: entries[0].assetClass,
      status,
      bySource,
      sourcesPresent,
      sourcesMissing,
      quantitySpreadPct,
      priceSpreadPct,
      marketValueSpreadPct,
      flagged: status !== "matched",
    })
  }

  return rows.sort((a, b) => a.symbol.localeCompare(b.symbol))
}
