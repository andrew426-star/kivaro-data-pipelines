import { SOURCE_FORMAT_CONFIG } from "@/lib/pipeline/source-formats"
import { SELF_CONSISTENCY_TOLERANCE_PCT } from "@/lib/pipeline/tolerance"
import type { CanonicalField, FieldMappingProposal, NormalizedHolding, RawParsedSource } from "@/lib/pipeline/types"

export interface NormalizeWarning {
  sourceId: RawParsedSource["sourceId"]
  symbol: string
  message: string
}

export interface NormalizeResult {
  holdings: NormalizedHolding[]
  warnings: NormalizeWarning[]
}

function percentSpread(a: number, b: number): number {
  const base = Math.max(Math.abs(a), Math.abs(b))
  if (base === 0) return 0
  return (Math.abs(a - b) / base) * 100
}

// Applies the validated field mapping deterministically to the actual raw
// row values. The AI proposals that feed `validMappings` never touch a
// data value themselves — only the field-name-level mapping decision.
export function normalizeHoldings(
  sources: RawParsedSource[],
  validMappings: FieldMappingProposal[]
): NormalizeResult {
  const holdings: NormalizedHolding[] = []
  const warnings: NormalizeWarning[] = []

  for (const source of sources) {
    const rawFieldForCanonical = new Map<CanonicalField, string>()
    for (const m of validMappings) {
      if (m.sourceId === source.sourceId && m.canonicalField !== "unmapped") {
        rawFieldForCanonical.set(m.canonicalField, m.rawField)
      }
    }

    const format = SOURCE_FORMAT_CONFIG[source.sourceId]

    for (const row of source.rows) {
      const get = (field: CanonicalField): string => {
        const rawField = rawFieldForCanonical.get(field)
        return rawField ? (row[rawField] ?? "") : ""
      }

      const symbol = get("symbol").trim()
      const name = get("name").trim()

      const assetClassRaw = get("assetClass")
      const assetClassCoerced = format.assetClassNormalizer(assetClassRaw)
      if (assetClassCoerced.warning) warnings.push({ sourceId: source.sourceId, symbol, message: assetClassCoerced.warning })

      const quantityCoerced = format.numberParser(get("quantity"))
      if (quantityCoerced.warning) warnings.push({ sourceId: source.sourceId, symbol, message: quantityCoerced.warning })

      const priceCoerced = format.numberParser(get("price"))
      if (priceCoerced.warning) warnings.push({ sourceId: source.sourceId, symbol, message: priceCoerced.warning })

      const marketValueCoerced = format.numberParser(get("marketValue"))
      if (marketValueCoerced.warning) warnings.push({ sourceId: source.sourceId, symbol, message: marketValueCoerced.warning })

      const asOfDateCoerced = format.dateParser(get("asOfDate"))
      if (asOfDateCoerced.warning) warnings.push({ sourceId: source.sourceId, symbol, message: asOfDateCoerced.warning })

      const quantity = quantityCoerced.value
      const price = priceCoerced.value
      const marketValue = marketValueCoerced.value
      const impliedMarketValue = Math.round(quantity * price * 100) / 100
      const selfConsistent = percentSpread(marketValue, impliedMarketValue) <= SELF_CONSISTENCY_TOLERANCE_PCT

      holdings.push({
        sourceId: source.sourceId,
        symbol,
        name,
        assetClass: assetClassCoerced.value,
        quantity,
        price,
        marketValue,
        impliedMarketValue,
        asOfDate: asOfDateCoerced.value,
        selfConsistent,
      })
    }
  }

  return { holdings, warnings }
}
