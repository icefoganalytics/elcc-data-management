import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import FundingLineValuesEnrollmentChart from "@/components/funding-line-values/FundingLineValuesEnrollmentChart.vue"
import { mockVuetify } from "@/tests/support"

describe("web/src/components/funding-line-values/FundingLineValuesEnrollmentChart.vue", () => {
  describe("latest enrollment chart", () => {
    test("when ledger rows span fiscal periods, displays only the latest period actual occupancy rates", async () => {
      // Arrange
      const httpClientMock = vi.mocked(httpClient, true)
      httpClientMock.get.mockResolvedValue({
        data: {
          childCareSpaces: [
            {
              id: 1,
              centreId: 1,
              fiscalPeriodId: 2,
              fundingSubmissionLineId: 1,
              lineName: "Infants",
              monthlyAmount: "100.0000",
              estimatedChildOccupancyRate: "0.5000",
              actualChildOccupancyRate: "0.2500",
              estimatedComputedTotal: "50.0000",
              actualComputedTotal: "25.0000",
              createdAt: "2024-05-01",
              updatedAt: "2024-05-01",
              policy: {
                show: true,
                create: false,
                update: true,
                destroy: false,
              },
            },
            {
              id: 2,
              centreId: 1,
              fiscalPeriodId: 2,
              fundingSubmissionLineId: 2,
              lineName: "Toddlers",
              monthlyAmount: "200.0000",
              estimatedChildOccupancyRate: "0.5000",
              actualChildOccupancyRate: "0.5000",
              estimatedComputedTotal: "100.0000",
              actualComputedTotal: "100.0000",
              createdAt: "2024-05-01",
              updatedAt: "2024-05-01",
              policy: {
                show: true,
                create: false,
                update: true,
                destroy: false,
              },
            },
            {
              id: 3,
              centreId: 1,
              fiscalPeriodId: 1,
              fundingSubmissionLineId: 1,
              lineName: "Infants",
              monthlyAmount: "100.0000",
              estimatedChildOccupancyRate: "0.5000",
              actualChildOccupancyRate: "0.7500",
              estimatedComputedTotal: "50.0000",
              actualComputedTotal: "75.0000",
              createdAt: "2024-04-01",
              updatedAt: "2024-04-01",
              policy: {
                show: true,
                create: false,
                update: true,
                destroy: false,
              },
            },
          ],
          totalCount: 3,
        },
      })

      // Act
      const wrapper = mount(FundingLineValuesEnrollmentChart, {
        props: {
          centreId: 1,
          fiscalYear: "2024-2025",
        },
        global: {
          plugins: [mockVuetify()],
          stubs: {
            apexchart: {
              props: ["options", "series"],
              template: '<div>{{ options.labels.join(",") }}:{{ series.join(",") }}</div>',
            },
          },
        },
      })
      await flushPromises()

      // Assert
      expect({
        chart: wrapper.text(),
        requests: httpClientMock.get.mock.calls,
      }).toEqual({
        chart: "Infants,Toddlers:0.25,0.5",
        requests: [
          [
            "/api/child-care-spaces",
            {
              params: {
                where: {
                  centreId: 1,
                },
                filters: {
                  byFiscalYear: "2024-25",
                },
                order: [
                  ["fiscalPeriod", "dateStart", "DESC"],
                  ["fundingSubmissionLineId", "ASC"],
                ],
                perPage: -1,
              },
            },
          ],
        ],
      })
    })
  })
})
