import {
  decodeAssetClassCode,
  expandAssetTypeAbbreviation,
  normalizeAssetClassFreeText,
  parseCurrencyOrCommaNumber,
  parseIsoDate,
  parseLongFormDate,
  parsePlainNumber,
  parseUsDate,
  type Coerced,
} from "@/lib/pipeline/coercion"
import type { SourceId } from "@/lib/pipeline/types"

// Each source's raw format is known in advance (like a documented vendor
// integration), not inferred per-row from the string itself — inferring
// date format from an ambiguous string like "01/02/2026" would be a real
// judgment call this pipeline deliberately doesn't leave implicit.
export const SOURCE_FORMAT_CONFIG: Record<
  SourceId,
  {
    dateParser: (raw: string) => Coerced<string>
    numberParser: (raw: string) => Coerced<number>
    assetClassNormalizer: (raw: string) => Coerced<string>
  }
> = {
  custodian_export: {
    dateParser: parseUsDate,
    numberParser: parsePlainNumber,
    assetClassNormalizer: expandAssetTypeAbbreviation,
  },
  market_data_feed: {
    dateParser: parseIsoDate,
    numberParser: parsePlainNumber,
    assetClassNormalizer: decodeAssetClassCode,
  },
  analyst_spreadsheet: {
    dateParser: parseLongFormDate,
    numberParser: parseCurrencyOrCommaNumber,
    assetClassNormalizer: normalizeAssetClassFreeText,
  },
}
