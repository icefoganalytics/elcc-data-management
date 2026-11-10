import { fundingSubmissionLineFactory } from "@/factories"

import UpdateService from "@/services/funding-submission-lines/update-service"

describe("api/src/services/funding-submission-lines/update-service.ts", () => {
  describe("UpdateService", () => {
    describe("#perform", () => {
      test.each([
        "Child Care Spaces",
        "Children with Diverse Needs",
        "Administration",
        "Administration (10% of Spaces)",
        "Quality Enhancement Program",
      ])("when an ordinary line changes to retired %s, rejects the update", async (sectionName) => {
        // Arrange
        const line = await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Other Section",
          lineName: "Infants",
          monthlyAmount: "100.00",
        })

        // Act
        const updatePromise = UpdateService.perform(line, {
          sectionName,
        })

        // Assert
        await expect(updatePromise).rejects.toThrow(
          `${sectionName} must be written through its dedicated ledger.`
        )
      })
    })
  })
})
