import AdministrationCost from "@/models/administration-cost"

export function doesNotContainAdministration(values: string): void {
  let lines: unknown
  try {
    lines = JSON.parse(values)
  } catch {
    return
  }

  if (
    Array.isArray(lines) &&
    lines.some(
      (line) =>
        typeof line === "object" &&
        line !== null &&
        "sectionName" in line &&
        (line.sectionName === AdministrationCost.SECTION_NAME ||
          line.sectionName === "Administration")
    )
  ) {
    throw new Error(
      `${AdministrationCost.SECTION_NAME} values must be written through the Administration costs ledger.`
    )
  }
}

export default doesNotContainAdministration
