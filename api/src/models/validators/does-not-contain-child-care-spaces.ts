import ChildCareSpace from "@/models/child-care-space"

export function doesNotContainChildCareSpaces(values: string): void {
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
        line.sectionName === ChildCareSpace.SECTION_NAME
    )
  ) {
    throw new Error(
      `${ChildCareSpace.SECTION_NAME} values must be written through the Child Care Spaces ledger.`
    )
  }
}

export default doesNotContainChildCareSpaces
