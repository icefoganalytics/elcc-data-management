import AdministrationCost from "@/models/administration-cost"

export function doesNotUseAdministrationSection(sectionName: string): void {
  if (sectionName !== AdministrationCost.SECTION_NAME && sectionName !== "Administration") return

  throw new Error(
    `${AdministrationCost.SECTION_NAME} configuration must use the Administration costs ledger.`
  )
}

export default doesNotUseAdministrationSection
