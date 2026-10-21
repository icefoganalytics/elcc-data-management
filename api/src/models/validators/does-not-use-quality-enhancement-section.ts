import QualityEnhancement from "@/models/quality-enhancement"

export function doesNotUseQualityEnhancementSection(sectionName: string): void {
  if (sectionName !== QualityEnhancement.SECTION_NAME) return

  throw new Error(
    `${QualityEnhancement.SECTION_NAME} configuration must use Quality Enhancement Categories.`
  )
}

export default doesNotUseQualityEnhancementSection
