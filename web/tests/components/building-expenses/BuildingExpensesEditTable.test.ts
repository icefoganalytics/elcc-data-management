import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import buildingExpensesApi, { type BuildingExpenseAsIndex } from "@/api/building-expenses-api"
import { mockVuetify } from "@/tests/support"
import BuildingExpensesEditTable from "@/components/building-expenses/BuildingExpensesEditTable.vue"

describe("web/src/components/building-expenses/BuildingExpensesEditTable.vue", () => {
  describe("BuildingExpensesEditTable", () => {
    describe("row-switch saves", () => {
      test("when a previous row is saving, blocks next-row editing until the response settles", async () => {
        // Arrange
        const first: BuildingExpenseAsIndex = {
          id: 1,
          categoryId: 1,
          centreId: 1,
          fiscalPeriodId: 1,
          subsidyRate: "0.3700",
          buildingUsagePercent: "1.0000",
          estimatedCost: "10.0000",
          actualCost: "0.0000",
          totalCost: "3.7000",
          notes: null,
          createdAt: "2026-04-01T00:00:00Z",
          updatedAt: "2026-04-01T00:00:00Z",
          category: {
            id: 1,
            fundingRegionId: 1,
            categoryName: "Rent or Mortgage",
            subsidyRate: "0.3700",
            createdAt: "2026-04-01T00:00:00Z",
            updatedAt: "2026-04-01T00:00:00Z",
          },
          policy: { show: true, create: true, update: true, destroy: true },
        }
        const second = {
          ...first,
          id: 2,
          categoryId: 2,
          category: { ...first.category, id: 2, categoryName: "Insurance" },
        }
        vi.spyOn(buildingExpensesApi, "list").mockResolvedValue({
          buildingExpenses: [first, second],
          totalCount: 2,
        })
        const pendingSave =
          Promise.withResolvers<Awaited<ReturnType<typeof buildingExpensesApi.update>>>()
        vi.spyOn(buildingExpensesApi, "update").mockReturnValue(pendingSave.promise)
        const wrapper = mount(BuildingExpensesEditTable, {
          props: { where: { centreId: 1, fiscalPeriodId: 1 } },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()
        await wrapper.findAll("tr.cursor-pointer")[0].trigger("click")
        await wrapper.get("tbody input").setValue("20.0000")

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.get(".v-data-table").attributes("aria-busy")).toEqual("true")
      })
    })
  })
})
