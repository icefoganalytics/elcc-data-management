import ChildCareSpace from "@/models/child-care-space"

export function doesNotUseChildCareSpacesSection(sectionName: string): void {
  if (sectionName !== ChildCareSpace.SECTION_NAME) return

  throw new Error(
    `${ChildCareSpace.SECTION_NAME} configuration must use the Child Care Spaces ledger.`
  )
}

export default doesNotUseChildCareSpacesSection
