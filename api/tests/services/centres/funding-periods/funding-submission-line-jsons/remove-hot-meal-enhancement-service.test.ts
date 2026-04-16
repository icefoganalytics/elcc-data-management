import { FundingSubmissionLineJson } from "@/models"

import {
  centreFactory,
  fiscalPeriodFactory,
  fundingPeriodFactory,
  fundingRegionFactory,
  fundingSubmissionLineFactory,
  fundingSubmissionLineJsonFactory,
} from "@/factories"

import RemoveHotMealEnhancementService from "@/services/centres/funding-periods/funding-submission-line-jsons/remove-hot-meal-enhancement-service"

describe("api/src/services/centres/funding-periods/funding-submission-line-jsons/remove-hot-meal-enhancement-service.ts", () => {
  describe("RemoveHotMealEnhancementService", () => {
    describe("#perform", () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      test("when provided with a centre, and Quality Enhancement Program sections exist in a future funding submission line json with enhanced amounts, removes enhancement", async () => {
        // Arrange
        vi.setSystemTime(new Date("2025-04-01"))

        const fundingRegion = await fundingRegionFactory.create({
          hotMealIncrementAmount: "32.06",
        })
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const futureFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          dateStart: new Date("2025-04-15"),
        })
        const fundingSubmissionLine = await fundingSubmissionLineFactory.create({
          sectionName: "Quality Enhancement Program",
          lineName: "Quality Enhancement",
          monthlyAmount: "100.00",
        })
        const fundingSubmissionLineJson = await fundingSubmissionLineJsonFactory.create({
          centreId: centre.id,
          dateStart: futureFiscalPeriod.dateStart,
          dateEnd: futureFiscalPeriod.dateEnd,
          lines: [
            {
              submissionLineId: fundingSubmissionLine.id,
              sectionName: "Quality Enhancement Program",
              lineName: "Quality Enhancement",
              monthlyAmount: "132.0600",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0",
              actualComputedTotal: "0",
            },
          ],
        })

        // Act
        await RemoveHotMealEnhancementService.perform(centre)

        // Assert
        await expect(fundingSubmissionLineJson.reload()).resolves.toEqual(
          expect.objectContaining({
            lines: [
              expect.objectContaining({
                monthlyAmount: "100.0000",
              }),
            ],
          })
        )
      })

      test("when provided with a centre, and future funding submission lines exist but are not Quality Enhancement Program sections, does not remove enhancement", async () => {
        // Arrange
        vi.setSystemTime(new Date("2025-04-01"))

        const fundingRegion = await fundingRegionFactory.create({
          hotMealIncrementAmount: "32.06",
        })
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const futureFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          dateStart: new Date("2025-04-15"),
        })
        const fundingSubmissionLine = await fundingSubmissionLineFactory.create({
          sectionName: "Child Care Spaces",
          lineName: "Infants",
          monthlyAmount: "100.00",
        })
        const fundingSubmissionLineJson = await fundingSubmissionLineJsonFactory.create({
          centreId: centre.id,
          dateStart: futureFiscalPeriod.dateStart,
          dateEnd: futureFiscalPeriod.dateEnd,
          lines: [
            {
              submissionLineId: fundingSubmissionLine.id,
              sectionName: "Child Care Spaces",
              lineName: "Infants",
              monthlyAmount: "132.0600",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0",
              actualComputedTotal: "0",
            },
          ],
        })

        // Act
        await RemoveHotMealEnhancementService.perform(centre)

        // Assert
        await expect(fundingSubmissionLineJson.reload()).resolves.toEqual(
          expect.objectContaining({
            lines: [
              expect.objectContaining({
                monthlyAmount: "132.0600",
              }),
            ],
          })
        )
      })

      test("when no future fiscal periods exist, does nothing", async () => {
        // Arrange
        vi.setSystemTime(new Date("2025-04-01"))

        const fundingRegion = await fundingRegionFactory.create({
          hotMealIncrementAmount: "32.06",
        })
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const pastFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          dateStart: new Date("2025-03-15"),
        })
        const fundingSubmissionLine = await fundingSubmissionLineFactory.create({
          sectionName: "Quality Enhancement Program",
          lineName: "Quality Enhancement",
          monthlyAmount: "100.00",
        })
        await fundingSubmissionLineJsonFactory.create({
          centreId: centre.id,
          dateStart: pastFiscalPeriod.dateStart,
          dateEnd: pastFiscalPeriod.dateEnd,
          lines: [
            {
              submissionLineId: fundingSubmissionLine.id,
              sectionName: "Quality Enhancement Program",
              lineName: "Quality Enhancement",
              monthlyAmount: "132.0600",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0",
              actualComputedTotal: "0",
            },
          ],
        })

        // Act & Assert
        await expect(RemoveHotMealEnhancementService.perform(centre)).resolves.not.toThrow()
      })

      test("when multiple lines exist including Quality Enhancement Program sections and non-Quality Enhancement Program sections, only removes enhancement from Quality Enhancement Program sections", async () => {
        // Arrange
        vi.setSystemTime(new Date("2025-04-01"))

        const fundingRegion = await fundingRegionFactory.create({
          hotMealIncrementAmount: "32.06",
        })
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const futureFiscalPeriod = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          dateStart: new Date("2025-04-15"),
        })
        const qualityLine = await fundingSubmissionLineFactory.create({
          sectionName: "Quality Enhancement Program",
          lineName: "Quality Enhancement",
          monthlyAmount: "100.00",
        })
        const otherLine = await fundingSubmissionLineFactory.create({
          sectionName: "Child Care Spaces",
          lineName: "Infants",
          monthlyAmount: "200.00",
        })
        const fundingSubmissionLineJson = await fundingSubmissionLineJsonFactory.create({
          centreId: centre.id,
          dateStart: futureFiscalPeriod.dateStart,
          dateEnd: futureFiscalPeriod.dateEnd,
          lines: [
            {
              submissionLineId: qualityLine.id,
              sectionName: "Quality Enhancement Program",
              lineName: "Quality Enhancement",
              monthlyAmount: "132.0600",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0",
              actualComputedTotal: "0",
            },
            {
              submissionLineId: otherLine.id,
              sectionName: "Child Care Spaces",
              lineName: "Infants",
              monthlyAmount: "232.0600",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0",
              actualComputedTotal: "0",
            },
          ],
        })

        // Act
        await RemoveHotMealEnhancementService.perform(centre)

        // Assert
        await expect(fundingSubmissionLineJson.reload()).resolves.toEqual(
          expect.objectContaining({
            lines: [
              expect.objectContaining({
                monthlyAmount: "100.0000",
              }),
              expect.objectContaining({
                monthlyAmount: "232.0600",
              }),
            ],
          })
        )
      })

      test("when multiple funding submission line JSON entries exist, removes enhancement from all Quality Enhancement Program sections across all entries", async () => {
        // Arrange
        vi.setSystemTime(new Date("2025-04-01"))

        const fundingRegion = await fundingRegionFactory.create({
          hotMealIncrementAmount: "32.06",
        })
        const centre = await centreFactory.create({
          fundingRegionId: fundingRegion.id,
        })
        const fundingPeriod = await fundingPeriodFactory.create({
          fiscalYear: "2025-2026",
        })
        const futureFiscalPeriod1 = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          dateStart: new Date("2025-04-15"),
        })
        const futureFiscalPeriod2 = await fiscalPeriodFactory.create({
          fundingPeriodId: fundingPeriod.id,
          dateStart: new Date("2025-05-15"),
        })
        const qualityLine = await fundingSubmissionLineFactory.create({
          sectionName: "Quality Enhancement Program",
          lineName: "Quality Enhancement",
          monthlyAmount: "100.00",
        })
        const fundingSubmissionLineJson1 = await fundingSubmissionLineJsonFactory.create({
          centreId: centre.id,
          dateStart: futureFiscalPeriod1.dateStart,
          dateEnd: futureFiscalPeriod1.dateEnd,
          lines: [
            {
              submissionLineId: qualityLine.id,
              sectionName: "Quality Enhancement Program",
              lineName: "Quality Enhancement",
              monthlyAmount: "132.0600",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0",
              actualComputedTotal: "0",
            },
          ],
        })
        const fundingSubmissionLineJson2 = await fundingSubmissionLineJsonFactory.create({
          centreId: centre.id,
          dateStart: futureFiscalPeriod2.dateStart,
          dateEnd: futureFiscalPeriod2.dateEnd,
          lines: [
            {
              submissionLineId: qualityLine.id,
              sectionName: "Quality Enhancement Program",
              lineName: "Quality Enhancement",
              monthlyAmount: "132.0600",
              estimatedChildOccupancyRate: "0",
              actualChildOccupancyRate: "0",
              estimatedComputedTotal: "0",
              actualComputedTotal: "0",
            },
          ],
        })

        // Act
        await RemoveHotMealEnhancementService.perform(centre)

        // Assert
        const fundingSubmissionLineJsons = await FundingSubmissionLineJson.findAll()
        expect(fundingSubmissionLineJsons).toEqual([
          expect.objectContaining({
            id: fundingSubmissionLineJson1.id,
            lines: [
              expect.objectContaining({
                monthlyAmount: "100.0000",
              }),
            ],
          }),
          expect.objectContaining({
            id: fundingSubmissionLineJson2.id,
            lines: [
              expect.objectContaining({
                monthlyAmount: "100.0000",
              }),
            ],
          }),
        ])
      })
    })
  })
})
