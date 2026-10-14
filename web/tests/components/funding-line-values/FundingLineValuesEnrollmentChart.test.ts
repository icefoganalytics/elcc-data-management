import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import FundingLineValuesEnrollmentChart from "@/components/funding-line-values/FundingLineValuesEnrollmentChart.vue"
import { mockVuetify } from "@/tests/support"

describe("web/src/components/funding-line-values/FundingLineValuesEnrollmentChart.vue", () => {
  describe("FundingLineValuesEnrollmentChart", () => {
    describe("latest enrollment chart", () => {
      test("when ledger rows span fiscal periods, selects the latest period categories and occupancy rates", async () => {
        // Arrange
        const httpClientMock = vi.mocked(httpClient, true)
        httpClientMock.get.mockResolvedValue({
          data: {
            childCareSpaces: [
              {
                id: 1,
                centreId: 1,
                fiscalPeriodId: 2,
                categoryId: 1,
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
                categoryId: 2,
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
                categoryId: 1,
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
            stubs: { apexchart: true },
          },
        })
        await flushPromises()

        // Assert
        const chart = wrapper.getComponent({ name: "apexchart" })
        expect(chart.props()).toEqual(
          expect.objectContaining({
            options: expect.objectContaining({
              labels: ["Infants", "Toddlers"],
            }),
            series: [0.25, 0.5],
          })
        )
        wrapper.unmount()
      })

      test("when future months have no enrollment, retains every category from the latest enrolled month", async () => {
        // Arrange
        vi.mocked(httpClient, true).get.mockResolvedValue({
          data: {
            childCareSpaces: [
              { fiscalPeriodId: 12, lineName: "Infants", actualChildOccupancyRate: "0" },
              { fiscalPeriodId: 12, lineName: "Toddlers", actualChildOccupancyRate: "0" },
              { fiscalPeriodId: 2, lineName: "Infants", actualChildOccupancyRate: "0.25" },
              { fiscalPeriodId: 2, lineName: "Toddlers", actualChildOccupancyRate: "0" },
              { fiscalPeriodId: 1, lineName: "Infants", actualChildOccupancyRate: "0.75" },
            ],
            totalCount: 5,
          },
        })
        const wrapper = mount(FundingLineValuesEnrollmentChart, {
          props: {
            centreId: 1,
            fiscalYear: "2024-2025",
          },
          global: {
            plugins: [mockVuetify()],
            stubs: { apexchart: true },
          },
        })

        // Act
        await flushPromises()

        // Assert
        const chart = wrapper.getComponent({ name: "apexchart" })
        expect(chart.props()).toEqual(
          expect.objectContaining({
            options: expect.objectContaining({
              labels: ["Infants", "Toddlers"],
            }),
            series: [0.25, 0],
          })
        )
        wrapper.unmount()
      })
    })
  })
})
