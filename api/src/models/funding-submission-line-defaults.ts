import FundingSubmissionLine from "@/models/funding-submission-line"

export type FundingSubmissionLineDefault = Pick<
  FundingSubmissionLine,
  "sectionName" | "lineName" | "fromAge" | "toAge" | "monthlyAmount"
>
export const FUNDING_SUBMISSION_LINE_DEFAULTS = Object.freeze<FundingSubmissionLineDefault[]>([
  {
    sectionName: "Children with Diverse Needs",
    lineName: "Toddlers",
    fromAge: 2,
    toAge: 3,
    monthlyAmount: "54.96",
  },
  {
    sectionName: "Children with Diverse Needs",
    lineName: "Preschool",
    fromAge: 4,
    toAge: 5,
    monthlyAmount: "91.6",
  },
  {
    sectionName: "Children with Diverse Needs",
    lineName: "Kindergarten",
    fromAge: 5,
    toAge: 6,
    monthlyAmount: "91.6",
  },
  {
    sectionName: "Children with Diverse Needs",
    lineName: "School Age",
    fromAge: 5,
    toAge: 6,
    monthlyAmount: "114.5",
  },
])

export default FUNDING_SUBMISSION_LINE_DEFAULTS
