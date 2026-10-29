import doesNotUseLedgerSection from "@/models/validators/does-not-use-ledger-section"

export function doesNotContainLedgerSections(values: string): void {
  let lines: unknown
  try {
    lines = JSON.parse(values)
  } catch {
    return
  }

  if (!Array.isArray(lines)) return

  for (const line of lines) {
    if (
      typeof line !== "object" ||
      line === null ||
      !("sectionName" in line) ||
      typeof line.sectionName !== "string"
    ) {
      continue
    }

    doesNotUseLedgerSection(line.sectionName)
  }
}

export default doesNotContainLedgerSections
