import ADMINISTRATION_COST_SECTION_NAME from "@/models/administration-cost-section-name"

export function doesNotUseAdministrationSection(sectionName: string): void {
  if (sectionName !== ADMINISTRATION_COST_SECTION_NAME) return

  throw new Error(
    `${ADMINISTRATION_COST_SECTION_NAME} configuration must use the Administration costs ledger.`
  )
}

export default doesNotUseAdministrationSection
