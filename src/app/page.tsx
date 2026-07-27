import { CanonicalSchemaCard } from "@/components/canonical-schema-card"
import { PipelineConsole } from "@/components/pipeline-console"
import { SampleDataBanner } from "@/components/sample-data-banner"

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
      <header className="flex flex-col gap-1 py-2">
        <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Investment Data Processing Pipelines
        </span>
        <h1 className="font-heading text-2xl text-gradient-green sm:text-3xl">
          Three Vendors, Three Formats, One Consistent Schema
        </h1>
        <p className="text-sm text-muted-foreground">
          A custodian export, a market data vendor feed, and an analyst spreadsheet — three real
          parsing problems, normalized into one schema. AI proposes the field mapping; it never
          touches a single data value. Every number is deterministically coerced and cross-validated.
        </p>
      </header>

      <SampleDataBanner />
      <CanonicalSchemaCard />
      <PipelineConsole />
    </div>
  )
}
