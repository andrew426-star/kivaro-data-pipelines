"use client"

import { useState } from "react"
import { FileCodeIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface RawSourceSummary {
  sourceId: string
  sourceLabel: string
  rawText: string
  rawFieldNames: string[]
  rowCount: number
}

export function SourceRawViewer({ sources }: { sources: RawSourceSummary[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = sources[activeIndex]

  return (
    <Card className="glow-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <FileCodeIcon className="size-4 text-primary" />
          Raw Sources — Before Any Interpretation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {sources.map((s, i) => (
            <button
              key={s.sourceId}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                i === activeIndex ? "border border-primary/40 text-primary" : "glow-border-hover text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.sourceLabel}
            </button>
          ))}
        </div>
        {active && (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{active.rowCount} rows</span>
              <span>{active.rawFieldNames.length} raw fields: {active.rawFieldNames.join(", ")}</span>
            </div>
            <pre className="max-h-80 overflow-auto rounded-lg bg-secondary/40 p-3 text-xs whitespace-pre text-muted-foreground">
              {active.rawText}
            </pre>
          </>
        )}
      </CardContent>
    </Card>
  )
}
