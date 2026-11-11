import FundingSubmissionLine from "@/models/funding-submission-line"

export type FundingSubmissionLineDefault = Pick<
  FundingSubmissionLine,
  "sectionName" | "lineName" | "fromAge" | "toAge" | "monthlyAmount"
>
export const FUNDING_SUBMISSION_LINE_DEFAULTS = Object.freeze<FundingSubmissionLineDefault[]>([])

export default FUNDING_SUBMISSION_LINE_DEFAULTS
