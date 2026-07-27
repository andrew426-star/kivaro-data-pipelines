import { Badge } from "@/components/ui/badge"
import type { CrossSourceStatus } from "@/lib/pipeline/types"

const STATUS_LABELS: Record<CrossSourceStatus, string> = {
  matched: "matched",
  quantity_mismatch: "quantity mismatch",
  price_mismatch: "price mismatch",
  market_value_mismatch: "market value mismatch",
  partial_coverage: "partial coverage",
}

const STATUS_STYLES: Record<CrossSourceStatus, string> = {
  matched: "border-primary/30 text-primary",
  quantity_mismatch: "border-destructive/40 text-destructive",
  price_mismatch: "border-destructive/40 text-destructive",
  market_value_mismatch: "border-destructive/40 text-destructive",
  partial_coverage: "border-accent/40 text-accent",
}

export function StatusBadge({ status }: { status: CrossSourceStatus }) {
  return (
    <Badge variant="outline" className={`shrink-0 ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
