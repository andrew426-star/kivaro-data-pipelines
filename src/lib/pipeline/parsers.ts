import { CUSTODIAN_LAYOUT_SPEC } from "@/lib/pipeline/sample-sources"
import type { RawParsedSource } from "@/lib/pipeline/types"

// Real, format-specific parsing — each source's structure is genuinely
// different (positional slicing, nested JSON traversal, quote-aware
// delimited text), not one generic "AI, make sense of this" call.

export function parseFixedWidth(rawText: string, sourceId: "custodian_export", sourceLabel: string): RawParsedSource {
  const lines = rawText.split("\n").filter((l) => l.trim().length > 0)
  const rows: Record<string, string>[] = lines.map((line) => {
    const row: Record<string, string> = {}
    for (const { field, start, end } of CUSTODIAN_LAYOUT_SPEC) {
      row[field] = line.slice(start, end).trim()
    }
    return row
  })
  const rawFieldNames = CUSTODIAN_LAYOUT_SPEC.map((s) => s.field)
  return { sourceId, sourceLabel, rawText, rawFieldNames, rows }
}

// Flattens a one-level-nested JSON object to dot-path keys, e.g.
// { identifiers: { sym: "AAPL" } } -> { "identifiers.sym": "AAPL" }.
function flattenOneLevel(obj: Record<string, unknown>): Record<string, string> {
  const flat: Record<string, string> = {}
  for (const [groupKey, groupValue] of Object.entries(obj)) {
    if (groupValue && typeof groupValue === "object" && !Array.isArray(groupValue)) {
      for (const [k, v] of Object.entries(groupValue as Record<string, unknown>)) {
        flat[`${groupKey}.${k}`] = String(v)
      }
    } else {
      flat[groupKey] = String(groupValue)
    }
  }
  return flat
}

export function parseNestedJson(rawText: string, sourceId: "market_data_feed", sourceLabel: string): RawParsedSource {
  const parsed = JSON.parse(rawText) as Record<string, unknown>[]
  const rows = parsed.map(flattenOneLevel)
  const rawFieldNames = rows.length > 0 ? Object.keys(rows[0]) : []
  return { sourceId, sourceLabel, rawText, rawFieldNames, rows }
}

// A small, real quote-aware CSV line splitter — naive split(",") breaks on
// quoted fields containing commas (long-form dates, comma-thousands
// currency strings), which is exactly why this source needs its own
// parser rather than reusing the fixed-width or JSON approach.
function splitCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ",") {
        fields.push(current)
        current = ""
      } else {
        current += char
      }
    }
  }
  fields.push(current)
  return fields
}

export function parseMessyCsv(rawText: string, sourceId: "analyst_spreadsheet", sourceLabel: string): RawParsedSource {
  const lines = rawText.split("\n").filter((l) => l.trim().length > 0)
  const rawFieldNames = splitCsvLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    const row: Record<string, string> = {}
    rawFieldNames.forEach((name, i) => {
      row[name] = values[i] ?? ""
    })
    return row
  })
  return { sourceId, sourceLabel, rawText, rawFieldNames, rows }
}
