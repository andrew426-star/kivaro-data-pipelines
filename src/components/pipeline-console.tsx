"use client"

import { useEffect, useState } from "react"
import { AlertTriangleIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CrossSourceValidationPanel } from "@/components/cross-source-validation-panel"
import { FieldMappingAuditTable, type FieldMappingData } from "@/components/field-mapping-audit-table"
import { NormalizedHoldingsTable } from "@/components/normalized-holdings-table"
import { SourceRawViewer, type RawSourceSummary } from "@/components/source-raw-viewer"
import type { CrossSourceValidationRow, NormalizedHolding } from "@/lib/pipeline/types"

interface PipelineResult {
  sources: RawSourceSummary[]
  fieldMapping: FieldMappingData
  normalizedHoldings: NormalizedHolding[]
  crossSourceValidation: CrossSourceValidationRow[]
}

type PipelineState =
  | { status: "loading" }
  | { status: "ready"; result: PipelineResult }
  | { status: "error"; message: string }

export function PipelineConsole() {
  const [state, setState] = useState<PipelineState>({ status: "loading" })

  async function runPipeline() {
    setState({ status: "loading" })
    try {
      const res = await fetch("/api/run-pipeline", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to run the pipeline.")
      setState({ status: "ready", result: data })
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Failed to run the pipeline." })
    }
  }

  useEffect(() => {
    runPipeline()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={runPipeline} disabled={state.status === "loading"}>
          <RefreshCwIcon className={state.status === "loading" ? "size-3.5 animate-spin" : "size-3.5"} />
          Re-run Pipeline
        </Button>
      </div>

      {state.status === "loading" && (
        <Card className="glow-border">
          <CardHeader>
            <CardTitle>Running Pipeline...</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Parsing sources, proposing field mappings, coercing values, cross-validating...
          </CardContent>
        </Card>
      )}

      {state.status === "error" && (
        <div className="glow-border flex items-center gap-2 rounded-lg p-3 text-sm text-destructive">
          <AlertTriangleIcon className="size-4 shrink-0" />
          {state.message}
        </div>
      )}

      {state.status === "ready" && (
        <>
          <SourceRawViewer sources={state.result.sources} />
          <FieldMappingAuditTable mapping={state.result.fieldMapping} />
          <NormalizedHoldingsTable holdings={state.result.normalizedHoldings} />
          <CrossSourceValidationPanel rows={state.result.crossSourceValidation} />
        </>
      )}
    </div>
  )
}
