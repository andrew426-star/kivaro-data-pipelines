import { TargetIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CANONICAL_FIELDS, CANONICAL_FIELD_DESCRIPTIONS } from "@/lib/pipeline/canonical-schema"

export function CanonicalSchemaCard() {
  return (
    <Card className="glow-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <TargetIcon className="size-4 text-primary" />
          Canonical Target Schema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CANONICAL_FIELDS.map((field) => (
            <div key={field} className="glow-border-hover flex flex-col gap-0.5 rounded-lg p-2.5">
              <span className="font-mono text-sm text-foreground">{field}</span>
              <span className="text-xs text-muted-foreground">{CANONICAL_FIELD_DESCRIPTIONS[field]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
