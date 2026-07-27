export interface Coerced<T> {
  value: T
  warning: string | null
}

// Never throws — an unrecognized input degrades to a best-effort value
// plus a warning, rather than breaking the whole pipeline run over one
// bad cell (same "don't let one bad input take down the run" posture as
// the rest of this session's tools use error responses, not crashes).

export function parseUsDate(raw: string): Coerced<string> {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return { value: raw, warning: `Unrecognized US date format: "${raw}"` }
  const [, mm, dd, yyyy] = m
  return { value: `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`, warning: null }
}

export function parseIsoDate(raw: string): Coerced<string> {
  const trimmed = raw.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return { value: raw, warning: `Unrecognized ISO date format: "${raw}"` }
  return { value: trimmed, warning: null }
}

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
}

export function parseLongFormDate(raw: string): Coerced<string> {
  const m = raw.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/)
  if (!m) return { value: raw, warning: `Unrecognized long-form date: "${raw}"` }
  const [, monthName, day, year] = m
  const month = MONTHS[monthName.toLowerCase()]
  if (!month) return { value: raw, warning: `Unrecognized month name: "${monthName}"` }
  return { value: `${year}-${month}-${day.padStart(2, "0")}`, warning: null }
}

export function parsePlainNumber(raw: string): Coerced<number> {
  const n = Number(raw.trim())
  if (Number.isNaN(n)) return { value: 0, warning: `Unrecognized numeric value: "${raw}"` }
  return { value: n, warning: null }
}

export function parseCurrencyOrCommaNumber(raw: string): Coerced<number> {
  const cleaned = raw.trim().replace(/[$,]/g, "")
  const n = Number(cleaned)
  if (Number.isNaN(n)) return { value: 0, warning: `Unrecognized currency/numeric value: "${raw}"` }
  return { value: n, warning: null }
}

const CUSTODIAN_ASSET_TYPE_MAP: Record<string, string> = {
  EQUITY: "Equities",
  "FIXED INC": "Fixed Income",
  ALT: "Alternatives",
  DIGITAL: "Digital Assets",
  CASH: "Cash",
}

export function expandAssetTypeAbbreviation(raw: string): Coerced<string> {
  const key = raw.trim().toUpperCase()
  const value = CUSTODIAN_ASSET_TYPE_MAP[key]
  if (!value) return { value: raw, warning: `Unrecognized asset type code: "${raw}"` }
  return { value, warning: null }
}

const FEED_ASSET_CLASS_CODE_MAP: Record<string, string> = {
  EQ: "Equities",
  FI: "Fixed Income",
  ALT: "Alternatives",
  DA: "Digital Assets",
  CE: "Cash",
}

export function decodeAssetClassCode(raw: string): Coerced<string> {
  const key = raw.trim().toUpperCase()
  const value = FEED_ASSET_CLASS_CODE_MAP[key]
  if (!value) return { value: raw, warning: `Unrecognized asset class code: "${raw}"` }
  return { value, warning: null }
}

const FREE_TEXT_ASSET_CLASS_ALIASES: Record<string, string> = {
  equities: "Equities",
  equity: "Equities",
  "fixed income": "Fixed Income",
  alt: "Alternatives",
  alternatives: "Alternatives",
  digital: "Digital Assets",
  "digital assets": "Digital Assets",
  cash: "Cash",
}

export function normalizeAssetClassFreeText(raw: string): Coerced<string> {
  const key = raw.trim().toLowerCase()
  const value = FREE_TEXT_ASSET_CLASS_ALIASES[key]
  if (!value) return { value: raw, warning: `Unrecognized asset class free text: "${raw}"` }
  return { value, warning: null }
}
