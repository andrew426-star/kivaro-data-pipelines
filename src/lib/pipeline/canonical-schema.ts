import { CANONICAL_FIELDS, type CanonicalField } from "@/lib/pipeline/types"

export { CANONICAL_FIELDS }

export const CANONICAL_FIELD_DESCRIPTIONS: Record<CanonicalField, string> = {
  symbol: "The security's ticker symbol (e.g. AAPL).",
  name: "The security's descriptive/legal name.",
  assetClass: "The security's asset class category (Equities, Fixed Income, Alternatives, Digital Assets, Cash).",
  quantity: "Number of shares/units held.",
  price: "Price per share/unit as of the reporting date.",
  marketValue: "Total market value of the position (as reported by the source, not recomputed).",
  asOfDate: "The date this position snapshot is as of.",
}
