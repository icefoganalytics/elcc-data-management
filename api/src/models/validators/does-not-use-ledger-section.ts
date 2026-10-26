const ADMINISTRATION_SECTION_NAMES = ["Administration (10% of Spaces)", "Administration"]

export function doesNotUseLedgerSection(sectionName: string): void {
  if (sectionName !== "Child Care Spaces" && !ADMINISTRATION_SECTION_NAMES.includes(sectionName)) {
    return
  }

  throw new Error(`${sectionName} must be written through its dedicated ledger.`)
}

export default doesNotUseLedgerSection
