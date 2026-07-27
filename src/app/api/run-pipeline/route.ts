import { NextResponse } from "next/server"
import { Type } from "@google/genai"

import { GEMINI_MODEL, getGeminiClient } from "@/lib/gemini-client"
import { CANONICAL_FIELDS, CANONICAL_FIELD_DESCRIPTIONS } from "@/lib/pipeline/canonical-schema"
import { validateCrossSource } from "@/lib/pipeline/cross-source-validate"
import { normalizeHoldings } from "@/lib/pipeline/normalize"
import { parseFixedWidth, parseMessyCsv, parseNestedJson } from "@/lib/pipeline/parsers"
import {
  ANALYST_SPREADSHEET_RAW_TEXT,
  CUSTODIAN_EXPORT_RAW_TEXT,
  MARKET_DATA_FEED_RAW_TEXT,
} from "@/lib/pipeline/sample-sources"
import type { FieldMappingProposal, RawParsedSource } from "@/lib/pipeline/types"

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mappings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sourceId: {
            type: Type.STRING,
            format: "enum",
            enum: ["custodian_export", "market_data_feed", "analyst_spreadsheet"],
            description: "Must exactly match one of the source IDs supplied in the input.",
          },
          rawField: {
            type: Type.STRING,
            description: "Must exactly match one of the raw field names supplied for this source. Never invent a field name not present in the input.",
          },
          canonicalField: {
            type: Type.STRING,
            format: "enum",
            enum: [...CANONICAL_FIELDS, "unmapped"],
            description: "The canonical target field this raw field represents, or 'unmapped' if no canonical field applies with reasonable confidence.",
          },
          confidence: { type: Type.STRING, format: "enum", enum: ["high", "medium", "low"] },
          rationale: {
            type: Type.STRING,
            description: "One sentence grounded in the raw field name itself (or, for 'unmapped', why no canonical field applies). Plain prose only — no markdown formatting of any kind (no **bold**, no #headers, no bullet dashes).",
          },
        },
        required: ["sourceId", "rawField", "canonicalField", "confidence", "rationale"],
      },
      description: "Exactly one entry for every raw field name supplied, across all three sources — including fields left unmapped. Never omit a field.",
    },
  },
  required: ["mappings"],
}

function buildPrompt(sources: RawParsedSource[]): string {
  const canonicalSchemaText = CANONICAL_FIELDS.map((f) => `- ${f}: ${CANONICAL_FIELD_DESCRIPTIONS[f]}`).join("\n")
  const sourcesText = sources
    .map((s) => `SOURCE "${s.sourceId}" (${s.sourceLabel}) — raw field names: ${s.rawFieldNames.join(", ")}`)
    .join("\n")

  return `You are mapping raw data field names from three heterogeneous investment data sources onto a fixed canonical schema. You are given ONLY field names — never actual data values — because your job is a semantic naming judgment, not a data transformation. For every single raw field name listed for every source, propose exactly one mapping entry, including an explicit "unmapped" entry for fields that don't correspond to any canonical field (e.g. internal account numbers, vendor timestamps unrelated to the position date, free-text notes). Do not skip any field, mapped or not.

CANONICAL SCHEMA:
${canonicalSchemaText}

SOURCES:
${sourcesText}`
}

export async function POST() {
  try {
    const sources: RawParsedSource[] = [
      parseFixedWidth(CUSTODIAN_EXPORT_RAW_TEXT, "custodian_export", "Custodian Export"),
      parseNestedJson(MARKET_DATA_FEED_RAW_TEXT, "market_data_feed", "Market Data Vendor Feed"),
      parseMessyCsv(ANALYST_SPREADSHEET_RAW_TEXT, "analyst_spreadsheet", "Analyst Spreadsheet Export"),
    ]

    const client = getGeminiClient()
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildPrompt(sources),
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    })

    const raw = response.text
    if (!raw) throw new Error("Gemini returned an empty response.")
    const parsed = JSON.parse(raw)
    const rawProposals = parsed.mappings as FieldMappingProposal[]

    // Check 1: drop any entry whose sourceId/rawField pair or canonicalField isn't real.
    const validSourceIds = new Set(sources.map((s) => s.sourceId))
    const rawFieldsBySource = new Map(sources.map((s) => [s.sourceId, new Set(s.rawFieldNames)]))
    const validCanonicalFields = new Set([...CANONICAL_FIELDS, "unmapped"])

    const validProposals = rawProposals.filter(
      (p) =>
        validSourceIds.has(p.sourceId) &&
        rawFieldsBySource.get(p.sourceId)?.has(p.rawField) &&
        validCanonicalFields.has(p.canonicalField)
    )

    // Check 2: duplicate-mapping collision — two raw fields from the same
    // source mapped to the same canonical field. Keep the higher-confidence
    // one, demote the rest to a discarded list rather than silently drop.
    const confidenceRank = { high: 3, medium: 2, low: 1 }
    const bestByKey = new Map<string, FieldMappingProposal>()
    const discardedDuplicates: FieldMappingProposal[] = []

    for (const p of validProposals) {
      if (p.canonicalField === "unmapped") {
        bestByKey.set(`${p.sourceId}::unmapped::${p.rawField}`, p)
        continue
      }
      const key = `${p.sourceId}::${p.canonicalField}`
      const existing = bestByKey.get(key)
      if (!existing) {
        bestByKey.set(key, p)
      } else if (confidenceRank[p.confidence] > confidenceRank[existing.confidence]) {
        discardedDuplicates.push(existing)
        bestByKey.set(key, p)
      } else {
        discardedDuplicates.push(p)
      }
    }
    const proposals = Array.from(bestByKey.values())

    // Check 3: raw fields the model never proposed an entry for at all —
    // a distinct, worse failure mode (silent omission) than an explicit
    // "unmapped" rejection.
    const consideredKeys = new Set(rawProposals.map((p) => `${p.sourceId}::${p.rawField}`))
    const notConsidered: { sourceId: RawParsedSource["sourceId"]; rawField: string }[] = []
    for (const s of sources) {
      for (const field of s.rawFieldNames) {
        if (!consideredKeys.has(`${s.sourceId}::${field}`)) {
          notConsidered.push({ sourceId: s.sourceId, rawField: field })
        }
      }
    }

    const { holdings, warnings } = normalizeHoldings(sources, proposals)
    const crossSourceValidation = validateCrossSource(holdings)

    return NextResponse.json({
      sources: sources.map((s) => ({
        sourceId: s.sourceId,
        sourceLabel: s.sourceLabel,
        rawText: s.rawText,
        rawFieldNames: s.rawFieldNames,
        rowCount: s.rows.length,
      })),
      fieldMapping: { proposals, discardedDuplicates, notConsidered },
      normalizedHoldings: holdings,
      crossSourceValidation,
      coercionWarnings: warnings,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to run the pipeline." },
      { status: 502 }
    )
  }
}
