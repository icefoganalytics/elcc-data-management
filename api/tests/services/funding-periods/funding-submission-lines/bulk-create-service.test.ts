import {
  childCareSpaceCategoryFactory,
  fundingPeriodFactory,
  fundingSubmissionLineFactory,
} from "@/factories"

import BulkCreateService from "@/services/funding-periods/funding-submission-lines/bulk-create-service"
import { FundingSubmissionLine } from "@/models"

describe("api/src/services/funding-periods/funding-submission-lines/bulk-create-service.ts", () => {
  describe("BulkCreateService", () => {
    describe("#perform", () => {
      test("when funding submission lines exist in another fiscal year, copies from newest fiscal year", async () => {
        // Arrange
        const _olderFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2023-2024",
          createdAt: new Date("2023-01-01"),
        })

        await fundingSubmissionLineFactory.create({
          fiscalYear: "2023/24",
          sectionName: "Old Section",
          lineName: "Old Line",
          fromAge: 0,
          toAge: 1,
          monthlyAmount: "100.00",
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2023/24",
          sectionName: "Old Section",
          lineName: "Another Old Line",
          fromAge: 2,
          toAge: 3,
          monthlyAmount: "200.00",
        })

        const _newerFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
          createdAt: new Date("2024-01-01"),
        })

        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "New Section",
          lineName: "New Line",
          fromAge: 0,
          toAge: 1,
          monthlyAmount: "150.00",
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "New Section",
          lineName: "Another New Line",
          fromAge: 2,
          toAge: 3,
          monthlyAmount: "250.00",
        })

        const targetFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })

        // Act
        const fundingSubmissionLines = await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        expect(fundingSubmissionLines).toEqual([
          expect.objectContaining({
            fiscalYear: "2025/26",
            sectionName: "New Section",
            lineName: "New Line",
            fromAge: 0,
            toAge: 1,
            monthlyAmount: "150",
          }),
          expect.objectContaining({
            fiscalYear: "2025/26",
            sectionName: "New Section",
            lineName: "Another New Line",
            fromAge: 2,
            toAge: 3,
            monthlyAmount: "250",
          }),
        ])
      })

      test("when cloning configuration with renamed categories, maps links to the target period without changing line snapshots", async () => {
        // Arrange
        const sourceFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2024-2025",
        })
        const renamedCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: sourceFundingPeriod.id,
          categoryName: "AAA",
          monthlyAmount: "742.5000",
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Administration (10% of Spaces)",
          lineName: "Infants",
          monthlyAmount: "100.0000",
          childCareSpaceCategoryId: renamedCategory.id,
        })
        await fundingSubmissionLineFactory.create({
          fiscalYear: "2024/25",
          sectionName: "Quality Enhancement Program",
          lineName: "Infants",
          monthlyAmount: "250.0000",
          childCareSpaceCategoryId: renamedCategory.id,
        })

        const targetFundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const targetCategory = await childCareSpaceCategoryFactory.create({
          fundingPeriodId: targetFundingPeriod.id,
          categoryName: "AAA",
          monthlyAmount: "742.5000",
        })

        // Act
        await BulkCreateService.perform(targetFundingPeriod)

        // Assert
        const persistedLines = await FundingSubmissionLine.findAll({
          where: { fiscalYear: "2025/26" },
          order: [["id", "ASC"]],
        })
        expect(persistedLines).toEqual([
          expect.objectContaining({
            sectionName: "Administration (10% of Spaces)",
            lineName: "Infants",
            monthlyAmount: "100",
            childCareSpaceCategoryId: targetCategory.id,
          }),
          expect.objectContaining({
            sectionName: "Quality Enhancement Program",
            lineName: "Infants",
            monthlyAmount: "250",
            childCareSpaceCategoryId: targetCategory.id,
          }),
        ])
      })
    })
  })
})
