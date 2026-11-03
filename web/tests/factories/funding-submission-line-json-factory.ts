import { Factory } from "fishery"

import { type FundingSubmissionLineJsonAsDetailed } from "@/api/funding-submission-line-jsons-api"

export const fundingSubmissionLineJsonFactory = Factory.define<FundingSubmissionLineJsonAsDetailed>(
  ({ sequence }) => {
    const timestamp = "2026-01-01T00:00:00.000Z"

    return {
      id: sequence,
      centreId: sequence,
      fiscalYear: "2024/25",
      dateName: "April",
      dateStart: "2024-04-01",
      dateEnd: "2024-04-30",
      lines: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  }
)

export default fundingSubmissionLineJsonFactory
