// Fully synthetic — no real fund, client, or capital is represented. See
// SampleDataBanner. Three raw payloads describing the SAME underlying
// holdings snapshot (one illustrative fund, period end 2026-06-30) via
// three genuinely different formats/schemas, exactly as a real fund might
// receive from a custodian, a market-data vendor, and a manual analyst
// export. Deliberate seeded scenarios (see the plan) prove the pipeline
// does real work rather than trivially agreeing:
//   NVDA    - analyst spreadsheet has a dropped-zero quantity error
//             (2,000 instead of 20,000); internally self-consistent
//             within that source (its own marketValue was computed from
//             the wrong quantity) — only cross-source comparison catches it.
//   GOOGL   - market data feed's marketValue is stale (computed from a
//             prior-day price); quantity/price agree everywhere, but this
//             source's own marketValue disagrees with quantity * price —
//             caught by self-consistency AND cross-source comparison.
//   VNQ     - present in the Custodian Export only.
//   GLD     - missing from the Analyst Spreadsheet (present in the other two).
//   TLT     - price differs ~0.1% across sources (different intraday
//             snapshot times) — should resolve as matched.
//   COST    - name differs cosmetically across all three sources — should
//             not be flagged (only quantitative fields are compared).
//   ACCT_NO / meta.vendor_ts / Notes - one genuinely unmappable extra raw
//             field per source, at increasing difficulty.

export const CUSTODIAN_EXPORT_RAW_TEXT = `ACCT-00417AAPL    APPLE INC                           EQUITY               15000      195.40      2931000.0006/30/2026
ACCT-00417MSFT    MICROSOFT CORP                      EQUITY                8000      415.20      3321600.0006/30/2026
ACCT-00417JPM     JPMORGAN CHASE & CO                 EQUITY               12000      245.80      2949600.0006/30/2026
ACCT-00417AGG     ISHARES CORE US AGG BOND ETF        FIXED INC            50000       98.20      4910000.0006/30/2026
ACCT-00417BTC     BITCOIN                             DIGITAL               18.5    67200.00      1243200.0006/30/2026
ACCT-00417CASH    CASH & EQUIVALENTS                  CASH                500000        1.00       500000.0006/30/2026
ACCT-00417NVDA    NVIDIA CORP                         EQUITY               20000      118.25      2365000.0006/30/2026
ACCT-00417GOOGL   ALPHABET INC                        EQUITY               10000      178.65      1786500.0006/30/2026
ACCT-00417VNQ     VANGUARD REAL ESTATE ETF            ALT                   9000       88.40       795600.0006/30/2026
ACCT-00417GLD     SPDR GOLD SHARES                    ALT                   6000      245.10      1470600.0006/30/2026
ACCT-00417TLT     ISHARES 20+ YEAR TREASURY BOND ETF  FIXED INC            25000       88.50      2212500.0006/30/2026
ACCT-00417COST    COSTCO WHOLESALE CORP               EQUITY                4000      912.40      3649600.0006/30/2026
`

// Layout spec for the fixed-width export above — shipped separately from
// the data file itself by the (fictional) custodian, not an inline header.
export const CUSTODIAN_LAYOUT_SPEC = [
  { field: "ACCT_NO", start: 0, end: 10 },
  { field: "TICKER", start: 10, end: 18 },
  { field: "SEC_NAME", start: 18, end: 54 },
  { field: "ASSET_TYPE", start: 54, end: 66 },
  { field: "QTY", start: 66, end: 80 },
  { field: "PRICE", start: 80, end: 92 },
  { field: "MKT_VAL", start: 92, end: 108 },
  { field: "AS_OF_DATE", start: 108, end: 118 },
] as const

export const MARKET_DATA_FEED_RAW_TEXT = `[
  {
    "identifiers": { "sym": "AAPL", "cls": "EQ" },
    "descriptors": { "desc": "Apple Inc" },
    "position": { "pos_qty": 15000, "px_last": 195.4, "mv_usd": 2931000 },
    "meta": { "dt": "2026-06-30", "vendor_ts": "2026-06-30T21:15:00Z" }
  },
  {
    "identifiers": { "sym": "MSFT", "cls": "EQ" },
    "descriptors": { "desc": "Microsoft Corp" },
    "position": { "pos_qty": 8000, "px_last": 415.2, "mv_usd": 3321600 },
    "meta": { "dt": "2026-06-30", "vendor_ts": "2026-06-30T21:15:00Z" }
  },
  {
    "identifiers": { "sym": "JPM", "cls": "EQ" },
    "descriptors": { "desc": "JPMorgan Chase & Co" },
    "position": { "pos_qty": 12000, "px_last": 245.8, "mv_usd": 2949600 },
    "meta": { "dt": "2026-06-30", "vendor_ts": "2026-06-30T21:15:00Z" }
  },
  {
    "identifiers": { "sym": "AGG", "cls": "FI" },
    "descriptors": { "desc": "iShares Core U.S. Aggregate Bond ETF" },
    "position": { "pos_qty": 50000, "px_last": 98.2, "mv_usd": 4910000 },
    "meta": { "dt": "2026-06-30", "vendor_ts": "2026-06-30T21:15:00Z" }
  },
  {
    "identifiers": { "sym": "BTC", "cls": "DA" },
    "descriptors": { "desc": "Bitcoin" },
    "position": { "pos_qty": 18.5, "px_last": 67200, "mv_usd": 1243200 },
    "meta": { "dt": "2026-06-30", "vendor_ts": "2026-06-30T21:15:00Z" }
  },
  {
    "identifiers": { "sym": "CASH", "cls": "CE" },
    "descriptors": { "desc": "Cash & Equivalents" },
    "position": { "pos_qty": 500000, "px_last": 1, "mv_usd": 500000 },
    "meta": { "dt": "2026-06-30", "vendor_ts": "2026-06-30T21:15:00Z" }
  },
  {
    "identifiers": { "sym": "NVDA", "cls": "EQ" },
    "descriptors": { "desc": "NVIDIA Corp" },
    "position": { "pos_qty": 20000, "px_last": 118.25, "mv_usd": 2365000 },
    "meta": { "dt": "2026-06-30", "vendor_ts": "2026-06-30T21:15:00Z" }
  },
  {
    "identifiers": { "sym": "GOOGL", "cls": "EQ" },
    "descriptors": { "desc": "Alphabet Inc" },
    "position": { "pos_qty": 10000, "px_last": 178.65, "mv_usd": 1750000 },
    "meta": { "dt": "2026-06-30", "vendor_ts": "2026-06-30T21:15:00Z" }
  },
  {
    "identifiers": { "sym": "GLD", "cls": "ALT" },
    "descriptors": { "desc": "SPDR Gold Shares" },
    "position": { "pos_qty": 6000, "px_last": 245.1, "mv_usd": 1470600 },
    "meta": { "dt": "2026-06-30", "vendor_ts": "2026-06-30T21:15:00Z" }
  },
  {
    "identifiers": { "sym": "TLT", "cls": "FI" },
    "descriptors": { "desc": "iShares 20+ Year Treasury Bond ETF" },
    "position": { "pos_qty": 25000, "px_last": 88.58, "mv_usd": 2214500 },
    "meta": { "dt": "2026-06-30", "vendor_ts": "2026-06-30T21:15:00Z" }
  },
  {
    "identifiers": { "sym": "COST", "cls": "EQ" },
    "descriptors": { "desc": "Costco Wholesale" },
    "position": { "pos_qty": 4000, "px_last": 912.4, "mv_usd": 3649600 },
    "meta": { "dt": "2026-06-30", "vendor_ts": "2026-06-30T21:15:00Z" }
  }
]`

export const ANALYST_SPREADSHEET_RAW_TEXT = `Symbol,Security,Class,Shares,Price,Value,Date,Notes
AAPL,Apple Inc.,Equities,"15,000",$195.40,"$2,931,000.00","June 30, 2026",
MSFT,Microsoft Corp.,equity,"8,000",$415.20,"$3,321,600.00","June 30, 2026",
JPM,JPMorgan Chase & Co.,Equities,"12,000",$245.80,"$2,949,600.00","June 30, 2026",
AGG,iShares Core U.S. Aggregate Bond ETF,Fixed Income,"50,000",$98.20,"$4,910,000.00","June 30, 2026",
BTC,Bitcoin,digital,18.5,"$67,200.00","$1,243,200.00","June 30, 2026",
CASH,Cash & Equivalents,cash,"500,000",$1.00,"$500,000.00","June 30, 2026",
NVDA,NVIDIA Corp.,Equities,"2,000",$118.25,"$236,500.00","June 30, 2026",qty per broker confirm
GOOGL,Alphabet Inc.,Equities,"10,000",$178.65,"$1,786,500.00","June 30, 2026",
TLT,iShares 20+ Year Treasury Bond ETF,Fixed Income,"25,000",$88.45,"$2,211,250.00","June 30, 2026",
COST,Costco Wholesale Corp.,Equities,"4,000",$912.40,"$3,649,600.00","June 30, 2026",reviewed
`
