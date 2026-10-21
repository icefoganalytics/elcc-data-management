import FundingSubmissionLine from "@/models/funding-submission-line"

export type FundingSubmissionLineDefault = Pick<
  FundingSubmissionLine,
  "sectionName" | "lineName" | "fromAge" | "toAge" | "monthlyAmount"
>
export const FUNDING_SUBMISSION_LINE_DEFAULTS = Object.freeze<FundingSubmissionLineDefault[]>([
  {
    sectionName: "Administration (10% of Spaces)",
    lineName: "Infants",
    fromAge: 0,
    toAge: 1,
    monthlyAmount: "70.0",
  },
  {
    sectionName: "Administration (10% of Spaces)",
    lineName: "Toddlers",
    fromAge: 2,
    toAge: 3,
    monthlyAmount: "70.0",
  },
  {
    sectionName: "Administration (10% of Spaces)",
    lineName: "Preschool",
    fromAge: 4,
    toAge: 5,
    monthlyAmount: "70.0",
  },
  {
    sectionName: "Administration (10% of Spaces)",
    lineName: "Kindergarten (PT)",
    fromAge: 5,
    toAge: 6,
    monthlyAmount: "35.0",
  },
  {
    sectionName: "Administration (10% of Spaces)",
    lineName: "Kindergarten (FT)",
    fromAge: 5,
    toAge: 6,
    monthlyAmount: "70.0",
  },
  {
    sectionName: "Administration (10% of Spaces)",
    lineName: "School Age (PT)",
    fromAge: 5,
    toAge: 6,
    monthlyAmount: "30.0",
  },
  {
    sectionName: "Administration (10% of Spaces)",
    lineName: "School Age (FT)",
    fromAge: 5,
    toAge: 6,
    monthlyAmount: "50.0",
  },
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
