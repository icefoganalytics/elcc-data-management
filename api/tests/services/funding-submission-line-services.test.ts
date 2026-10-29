import { FundingSubmissionLine } from "@/models"

import { FundingSubmissionLineServices } from "@/services/funding-submission-line-services"

describe("api/src/services/funding-submission-line-services.ts", () => {
  describe("FundingSubmissionLineServices", () => {
    describe("#bulkCreateFrom", () => {
      test("when the source contains the retired Child Care Spaces section, rejects cloning", async () => {
        // Arrange
        await FundingSubmissionLine.bulkCreate(
          [
            {
              fiscalYear: "2024/25",
              sectionName: "Child Care Spaces",
              lineName: "Infants",
              monthlyAmount: "100.0000",
            },
          ],
          { validate: false }
        )

        // Act
        const clonePromise = FundingSubmissionLineServices.bulkCreateFrom(
          { fiscalYear: "2025/26" },
          ["2024/25"]
        )

        // Assert
        await expect(clonePromise).rejects.toThrow(Error)
      })

      test("when cloning a source with a retired section, creates no target configuration", async () => {
        // Arrange
        await FundingSubmissionLine.bulkCreate(
          [
            {
              fiscalYear: "2024/25",
              sectionName: "Child Care Spaces",
              lineName: "Infants",
              monthlyAmount: "100.0000",
            },
          ],
          { validate: false }
        )

        // Act
        await FundingSubmissionLineServices.bulkCreateFrom({ fiscalYear: "2025/26" }, [
          "2024/25",
        ]).catch(() => undefined)

        // Assert
        const targetLines = await FundingSubmissionLine.findAll({
          where: { fiscalYear: "2025/26" },
        })
        expect(targetLines).toEqual([])
      })
    })
  })
})
