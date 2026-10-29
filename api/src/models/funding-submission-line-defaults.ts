import FundingSubmissionLine from "@/models/funding-submission-line"

export enum FundingSubmissionLineImmutableSectionNames {
  QUALITY_ENHANCEMENT_PROGRAM = "Quality Enhancement Program",
}

export enum FundingSubmissionLineEnhancementTypes {
  HOT_MEAL = "hot_meal",
}

export type FundingSubmissionLineDefault = Pick<
  FundingSubmissionLine,
  "sectionName" | "lineName" | "fromAge" | "toAge" | "monthlyAmount"
>
export const FUNDING_SUBMISSION_LINE_DEFAULTS = Object.freeze<FundingSubmissionLineDefault[]>([
  {
    sectionName: FundingSubmissionLineImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM,
    lineName: "Infants",
    fromAge: 0,
    toAge: 1,
    monthlyAmount: "206.1",
  },
  {
    sectionName: FundingSubmissionLineImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM,
    lineName: "Toddlers",
    fromAge: 2,
    toAge: 3,
    monthlyAmount: "154.58",
  },
  {
    sectionName: FundingSubmissionLineImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM,
    lineName: "Preschool",
    fromAge: 4,
    toAge: 5,
    monthlyAmount: "114.5",
  },
  {
    sectionName: FundingSubmissionLineImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM,
    lineName: "Kindergarten (PT)",
    fromAge: 5,
    toAge: 6,
    monthlyAmount: "114.5",
  },
  {
    sectionName: FundingSubmissionLineImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM,
    lineName: "Kindergarten (FT)",
    fromAge: 5,
    toAge: 6,
    monthlyAmount: "114.5",
  },
  {
    sectionName: FundingSubmissionLineImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM,
    lineName: "School Age (PT)",
    fromAge: 5,
    toAge: 6,
    monthlyAmount: "97.33",
  },
  {
    sectionName: FundingSubmissionLineImmutableSectionNames.QUALITY_ENHANCEMENT_PROGRAM,
    lineName: "School Age (FT)",
    fromAge: 5,
    toAge: 6,
    monthlyAmount: "97.33",
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
