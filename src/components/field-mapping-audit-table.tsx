import { AlertTriangleIcon, ListTreeIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FieldMappingProposal, SourceId } from "@/lib/pipeline/types"

const SOURCE_LABELS: Record<SourceId, string> = {
  custodian_export: "Custodian Export",
  market_data_feed: "Market Data Vendor Feed",
  analyst_spreadsheet: "Analyst Spreadsheet Export",
}

const CONFIDENCE_STYLES: Record<FieldMappingProposal["confidence"], string> = {
  high: "border-primary/30 text-primary",
  medium: "border-accent/40 text-accent",
  low: "border-destructive/40 text-destructive",
}

export interface FieldMappingData {
  proposals: FieldMappingProposal[]
  discardedDuplicates: FieldMappingProposal[]
  notConsidered: { sourceId: SourceId; rawField: string }[]
}

export function FieldMappingAuditTable({ mapping }: { mapping: FieldMappingData }) {
  const bySource = new Map<SourceId, FieldMappingProposal[]>()
  for (const p of mapping.proposals) {
    const list = bySource.get(p.sourceId) ?? []
    list.push(p)
    bySource.set(p.sourceId, list)
  }

  return (
    <Card className="glow-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <ListTreeIcon className="size-4 text-primary" />
          AI Field Mapping Audit
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {Array.from(bySource.entries()).map(([sourceId, proposals]) => (
          <div key={sourceId} className="flex flex-col gap-1.5">
            <span className="text-xs tracking-wide text-muted-foreground uppercase">{SOURCE_LABELS[sourceId]}</span>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                    <th className="pb-1.5 pr-3 font-medium">Raw Field</th>
                    <th className="pb-1.5 pr-3 font-medium">Canonical Field</th>
                    <th className="pb-1.5 pr-3 font-medium">Confidence</th>
                    <th className="pb-1.5 font-medium">Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p) => (
                    <tr key={`${p.sourceId}-${p.rawField}`} className="border-b border-border/50 last:border-0">
                      <td className="py-1.5 pr-3 font-mono text-xs text-foreground">{p.rawField}</td>
                      <td className="py-1.5 pr-3">
                        {p.canonicalField === "unmapped" ? (
                          <span className="text-xs text-muted-foreground italic">unmapped</span>
                        ) : (
                          <span className="font-mono text-xs text-primary">{p.canonicalField}</span>
                        )}
                      </td>
                      <td className="py-1.5 pr-3">
                        <Badge variant="outline" className={CONFIDENCE_STYLES[p.confidence]}>
                          {p.confidence}
                        </Badge>
                      </td>
                      <td className="py-1.5 text-xs text-muted-foreground">{p.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {(mapping.discardedDuplicates.length > 0 || mapping.notConsidered.length > 0) && (
          <div className="glow-border flex flex-col gap-2 rounded-lg p-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <AlertTriangleIcon className="size-3.5 text-accent" />
              Mapping quality flags
            </span>
            {mapping.discardedDuplicates.map((d, i) => (
              <p key={`dup-${i}`} className="text-muted-foreground">
                Discarded duplicate: <span className="font-mono text-foreground">{d.rawField}</span> ({SOURCE_LABELS[d.sourceId]}) was
                also proposed for <span className="font-mono text-foreground">{d.canonicalField}</span> at {d.confidence} confidence — a
                higher-confidence mapping for that field already existed.
              </p>
            ))}
            {mapping.notConsidered.map((n, i) => (
              <p key={`unc-${i}`} className="text-destructive">
                Not considered: <span className="font-mono">{n.rawField}</span> ({SOURCE_LABELS[n.sourceId]}) — the model never proposed
                a mapping for this field at all.
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
