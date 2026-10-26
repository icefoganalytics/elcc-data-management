export function doesNotUseLedgerSection(sectionName: string): void {
  if (
    sectionName !== "Child Care Spaces" &&
    sectionName !== "Administration (10% of Spaces)" &&
    sectionName !== "Administration"
  ) {
    return
  }

  throw new Error(`${sectionName} must be written through its dedicated ledger.`)
}

export default doesNotUseLedgerSection
