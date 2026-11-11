const LEDGER_SECTION_NAMES = [
  "Administration (10% of Spaces)",
  "Administration",
  "Child Care Spaces",
  "Children with Diverse Needs",
  "Quality Enhancement Program",
]

export function doesNotUseLedgerSection(sectionName: string): void {
  if (!LEDGER_SECTION_NAMES.includes(sectionName)) {
    return
  }

  throw new Error(`${sectionName} must be written through its dedicated ledger.`)
}

export default doesNotUseLedgerSection
