"use client"

import { useState } from "react"
import { GitCompareIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import type { CrossSourceValidationRow, SourceId } from "@/lib/pipeline/types"

const SOURCE_LABELS: Record<SourceId, string> = {
  custodian_export: "Custodian",
  market_data_feed: "Market Feed",
  analyst_spreadsheet: "Analyst",
}

function money(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

export function CrossSourceValidationPanel({ rows }: { rows: CrossSourceValidationRow[] }) {
  const [flaggedOnly, setFlaggedOnly] = useState(true)
  const visible = flaggedOnly ? rows.filter((r) => r.flagged) : rows
  const flaggedCount = rows.filter((r) => r.flagged).length

  return (
    <Card className="glow-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-1.5">
          <GitCompareIcon className="size-4 text-primary" />
          Cross-Source Validation
        </CardTitle>
        <button
          type="button"
          onClick={() => setFlaggedOnly((v) => !v)}
          className="glow-border-hover rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {flaggedOnly ? `Showing ${flaggedCount} flagged — show all ${rows.length}` : `Showing all ${rows.length} — show ${flaggedCount} flagged only`}
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {visible.map((row) => (
          <div key={row.symbol} className="glow-border-hover flex flex-col gap-1.5 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {row.symbol} <span className="text-xs font-normal text-muted-foreground">— {row.name}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  Present in: {row.sourcesPresent.map((s) => SOURCE_LABELS[s]).join(", ") || "none"}
                  {row.sourcesMissing.length > 0 && (
                    <> · Missing from: {row.sourcesMissing.map((s) => SOURCE_LABELS[s]).join(", ")}</>
                  )}
                </span>
              </div>
              <StatusBadge status={row.status} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(["custodian_export", "market_data_feed", "analyst_spreadsheet"] as SourceId[]).map((sid) => {
                const h = row.bySource[sid]
                return (
                  <div key={sid} className="flex flex-col rounded bg-secondary/40 p-2">
                    <span className="text-muted-foreground">{SOURCE_LABELS[sid]}</span>
                    {h ? (
                      <span className="text-foreground">
                        {h.quantity.toLocaleString()} @ {h.price.toLocaleString()} = {money(h.marketValue)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 italic">not present</span>
                    )}
                  </div>
                )
              })}
            </div>
            {(row.quantitySpreadPct !== null || row.priceSpreadPct !== null || row.marketValueSpreadPct !== null) && (
              <span className="text-xs text-muted-foreground">
                Spread — qty: {row.quantitySpreadPct?.toFixed(2) ?? "—"}% · price: {row.priceSpreadPct?.toFixed(2) ?? "—"}% · market value:{" "}
                {row.marketValueSpreadPct?.toFixed(2) ?? "—"}%
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
