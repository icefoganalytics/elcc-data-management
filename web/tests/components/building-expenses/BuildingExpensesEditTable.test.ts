import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import buildingExpensesApi, { type BuildingExpenseAsIndex } from "@/api/building-expenses-api"
import { mockVuetify } from "@/tests/support"
import BuildingExpensesEditTable from "@/components/building-expenses/BuildingExpensesEditTable.vue"

describe("web/src/components/building-expenses/BuildingExpensesEditTable.vue", () => {
  describe("BuildingExpensesEditTable", () => {
    describe("row-switch saves", () => {
      test("when a previous row is saving, keeps the destination editor inert", async () => {
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
        expect(wrapper.get(".v-data-table").attributes("inert")).toEqual("true")
      })

      test("when an expense save is interrupted, still allows confirmed deletion", async () => {
        // Arrange
        const expense: BuildingExpenseAsIndex = {
          id: 71,
          categoryId: 4,
          centreId: 2,
          fiscalPeriodId: 3,
          subsidyRate: "0.1000",
          buildingUsagePercent: "100.0000",
          estimatedCost: "100.0000",
          actualCost: "90.0000",
          totalCost: "190.0000",
          notes: null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          category: {
            id: 4,
            fundingRegionId: 3,
            categoryName: "Heating",
            subsidyRate: "0.1000",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
          policy: { show: true, create: true, update: true, destroy: true },
        }
        vi.spyOn(buildingExpensesApi, "list")
          .mockResolvedValueOnce({ buildingExpenses: [expense], totalCount: 1 })
          .mockResolvedValue({ buildingExpenses: [], totalCount: 0 })
        vi.spyOn(buildingExpensesApi, "update").mockRejectedValue(
          new UnexpectedApiResponseError(
            { method: "patch", url: "/api/building-expenses/71" },
            502,
            new AxiosHeaders()
          )
        )
        const destroy = vi.spyOn(buildingExpensesApi, "delete").mockResolvedValue()
        vi.spyOn(window, "confirm").mockReturnValue(true)
        const wrapper = mount(BuildingExpensesEditTable, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer td:nth-child(3)").trigger("click")
        await wrapper.get("input").setValue("125")
        await wrapper.get("input").trigger("keydown", { key: "Tab" })
        await flushPromises()

        // Act
        await wrapper.get("tbody button").trigger("click")
        await flushPromises()

        // Assert
        expect(destroy).toHaveBeenCalledWith(71)
        expect(wrapper.text()).not.toContain("Heating")
        expect(wrapper.text()).not.toContain("Automatic saving is paused")
      })

      test("when another expense is deleted, retains the latest interrupted draft", async () => {
        // Arrange
        const expense: BuildingExpenseAsIndex = {
          id: 71,
          categoryId: 4,
          centreId: 2,
          fiscalPeriodId: 3,
          subsidyRate: "0.1000",
          buildingUsagePercent: "100.0000",
          estimatedCost: "100.0000",
          actualCost: "90.0000",
          totalCost: "190.0000",
          notes: null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          category: {
            id: 4,
            fundingRegionId: 3,
            categoryName: "Heating",
            subsidyRate: "0.1000",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
          policy: { show: true, create: true, update: true, destroy: true },
        }
        const otherExpense = {
          ...expense,
          id: 72,
          categoryId: 5,
          category: { ...expense.category, id: 5, categoryName: "Cooling" },
        }
        vi.spyOn(buildingExpensesApi, "list")
          .mockResolvedValueOnce({ buildingExpenses: [expense, otherExpense], totalCount: 2 })
          .mockResolvedValue({ buildingExpenses: [expense], totalCount: 1 })
        vi.spyOn(buildingExpensesApi, "update").mockRejectedValue(
          new UnexpectedApiResponseError(
            { method: "patch", url: "/api/building-expenses/71" },
            502,
            new AxiosHeaders()
          )
        )
        vi.spyOn(buildingExpensesApi, "delete").mockResolvedValue()
        vi.spyOn(window, "confirm").mockReturnValue(true)
        const wrapper = mount(BuildingExpensesEditTable, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
        })
        await flushPromises()
        await wrapper.get("tbody td:nth-child(3)").trigger("click")
        await wrapper.get("input").setValue("125")
        await wrapper.get("input").trigger("keydown", { key: "Tab" })
        await flushPromises()

        // Act
        await wrapper.get("input").setValue("135")
        await wrapper.get("input").trigger("keydown", { key: "Tab" })
        await flushPromises()
        await wrapper.findAll("tbody button")[1].trigger("click")
        await flushPromises()
        await wrapper.get("tbody td:nth-child(3)").trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.get<HTMLInputElement>("input").element.value).toEqual("135")
      })
    })
  })
})
