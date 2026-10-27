import QualityEnhancement from "@/models/quality-enhancement"

export function doesNotContainQualityEnhancements(values: string): void {
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
        line.sectionName === QualityEnhancement.SECTION_NAME
    )
  ) {
    throw new Error(
      `${QualityEnhancement.SECTION_NAME} values must be written through the Quality Enhancements ledger.`
    )
  }
}

export default doesNotContainQualityEnhancements
