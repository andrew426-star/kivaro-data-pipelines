export type SourceId = "custodian_export" | "market_data_feed" | "analyst_spreadsheet"

export const CANONICAL_FIELDS = ["symbol", "name", "assetClass", "quantity", "price", "marketValue", "asOfDate"] as const
export type CanonicalField = (typeof CANONICAL_FIELDS)[number]

export interface RawParsedSource {
  sourceId: SourceId
  sourceLabel: string
  rawText: string // the literal raw payload, for the "ugly input" viewer
  rawFieldNames: string[]
  rows: Record<string, string>[] // raw field name -> raw string value, zero interpretation
}

export interface FieldMappingProposal {
  sourceId: SourceId
  rawField: string
  canonicalField: CanonicalField | "unmapped"
  confidence: "high" | "medium" | "low"
  rationale: string
}

export interface FieldMappingResult {
  proposals: FieldMappingProposal[]
  discardedDuplicates: FieldMappingProposal[]
  notConsidered: { sourceId: SourceId; rawField: string }[]
}

export interface NormalizedHolding {
  sourceId: SourceId
  symbol: string
  name: string
  assetClass: string // canonical label
  quantity: number
  price: number
  marketValue: number // as reported by the source, coerced — NOT recomputed from qty*price
  impliedMarketValue: number // qty * price, computed by us
  asOfDate: string // ISO YYYY-MM-DD
  selfConsistent: boolean // false if |marketValue - impliedMarketValue| exceeds tolerance
}

export type CrossSourceStatus =
  | "matched"
  | "quantity_mismatch"
  | "price_mismatch"
  | "market_value_mismatch"
  | "partial_coverage"

export interface CrossSourceValidationRow {
  symbol: string
  name: string
  assetClass: string
  status: CrossSourceStatus
  bySource: Partial<Record<SourceId, NormalizedHolding>>
  sourcesPresent: SourceId[]
  sourcesMissing: SourceId[]
  quantitySpreadPct: number | null
  priceSpreadPct: number | null
  marketValueSpreadPct: number | null
  flagged: boolean
}
