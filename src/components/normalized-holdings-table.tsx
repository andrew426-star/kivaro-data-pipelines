"use client"

import { useState } from "react"
import { CheckCircle2Icon, TableIcon, XCircleIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { NormalizedHolding, SourceId } from "@/lib/pipeline/types"

const SOURCE_LABELS: Record<SourceId, string> = {
  custodian_export: "Custodian Export",
  market_data_feed: "Market Data Vendor Feed",
  analyst_spreadsheet: "Analyst Spreadsheet Export",
}

function money(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })
}

export function NormalizedHoldingsTable({ holdings }: { holdings: NormalizedHolding[] }) {
  const [inconsistentOnly, setInconsistentOnly] = useState(false)
  const visible = inconsistentOnly ? holdings.filter((h) => !h.selfConsistent) : holdings
  const inconsistentCount = holdings.filter((h) => !h.selfConsistent).length

  return (
    <Card className="glow-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-1.5">
          <TableIcon className="size-4 text-primary" />
          Normalized Holdings — Per Source
        </CardTitle>
        {inconsistentCount > 0 && (
          <button
            type="button"
            onClick={() => setInconsistentOnly((v) => !v)}
            className="glow-border-hover rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {inconsistentOnly ? `Showing ${inconsistentCount} self-inconsistent — show all ${holdings.length}` : `Showing all ${holdings.length} — show ${inconsistentCount} self-inconsistent only`}
          </button>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
              <th className="pb-2 pr-3 font-medium">Symbol</th>
              <th className="pb-2 pr-3 font-medium">Source</th>
              <th className="pb-2 pr-3 font-medium">Asset Class</th>
              <th className="pb-2 pr-3 font-medium text-right">Qty</th>
              <th className="pb-2 pr-3 font-medium text-right">Price</th>
              <th className="pb-2 pr-3 font-medium text-right">Market Value</th>
              <th className="pb-2 font-medium text-right">Qty × Price</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((h) => (
              <tr key={`${h.sourceId}-${h.symbol}`} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{h.symbol}</span>
                    <span className="text-xs text-muted-foreground">{h.name}</span>
                  </div>
                </td>
                <td className="py-2 pr-3 text-xs text-muted-foreground">{SOURCE_LABELS[h.sourceId]}</td>
                <td className="py-2 pr-3 text-muted-foreground">{h.assetClass}</td>
                <td className="py-2 pr-3 text-right text-foreground">{h.quantity.toLocaleString()}</td>
                <td className="py-2 pr-3 text-right text-foreground">{money(h.price)}</td>
                <td className="py-2 pr-3 text-right text-foreground">{money(h.marketValue)}</td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-muted-foreground">{money(h.impliedMarketValue)}</span>
                    {h.selfConsistent ? (
                      <CheckCircle2Icon className="size-3.5 text-primary" />
                    ) : (
                      <Badge variant="outline" className="border-destructive/40 text-destructive">
                        <XCircleIcon className="size-3" />
                        inconsistent
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted-foreground/70">
          &ldquo;Qty × Price&rdquo; is independently computed and compared against the source&apos;s own reported market value —
          a mismatch means this source&apos;s data is internally inconsistent, regardless of what any other source reports.
        </p>
      </CardContent>
    </Card>
  )
}
