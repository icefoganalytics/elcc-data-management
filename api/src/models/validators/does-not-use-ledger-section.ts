const LEDGER_SECTION_NAMES = [
  "Child Care Spaces",
  "Administration (10% of Spaces)",
  "Administration",
]

export function doesNotUseLedgerSection(sectionName: string): void {
  if (!LEDGER_SECTION_NAMES.includes(sectionName)) {
    return
  }

  throw new Error(`${sectionName} must be written through its dedicated ledger.`)
}

export default doesNotUseLedgerSection
