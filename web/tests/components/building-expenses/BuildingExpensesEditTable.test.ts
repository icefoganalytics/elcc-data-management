import { flushPromises, mount } from "@vue/test-utils"
import { AxiosHeaders } from "axios"

import buildingExpensesApi, { type BuildingExpenseAsIndex } from "@/api/building-expenses-api"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"
import { useSnack } from "@/use/use-snack"

import { mockVuetify } from "@/tests/support"

import BuildingExpensesEditTable from "@/components/building-expenses/BuildingExpensesEditTable.vue"
import AppSnackbar from "@/components/layouts/AppSnackbar.vue"

describe("web/src/components/building-expenses/BuildingExpensesEditTable.vue", () => {
  describe("BuildingExpensesEditTable", () => {
    describe("interrupted edits", () => {
      beforeEach(() => {
        useSnack().reset()
        vi.stubGlobal("visualViewport", undefined)
      })

      test("when a save result is uncertain, keeps the edited value visible", async () => {
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
        vi.spyOn(buildingExpensesApi, "list").mockResolvedValue({
          buildingExpenses: [expense],
          totalCount: 1,
        })
        vi.spyOn(buildingExpensesApi, "update").mockRejectedValue(
          new UnexpectedApiResponseError(
            { method: "patch", url: "/api/building-expenses/71" },
            502,
            new AxiosHeaders()
          )
        )
        const wrapper = mount(BuildingExpensesEditTable, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
        })
        await flushPromises()

        // Act
        await wrapper.get("tr.cursor-pointer td:nth-child(3)").trigger("click")
        const input = wrapper.get<HTMLInputElement>("input")
        await input.setValue("125")
        await input.trigger("keydown", { key: "Tab" })
        await flushPromises()

        // Assert
        expect(wrapper.get("tbody tr td:nth-child(3)").text()).toEqual("$125.00")
      })

      test("when recovery dismissal leaves the edited row, does not replay the write", async () => {
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
        vi.spyOn(buildingExpensesApi, "list").mockResolvedValue({
          buildingExpenses: [expense],
          totalCount: 1,
        })
        const update = vi
          .spyOn(buildingExpensesApi, "update")
          .mockRejectedValue(
            new UnexpectedApiResponseError(
              { method: "patch", url: "/api/building-expenses/71" },
              502,
              new AxiosHeaders()
            )
          )
        const table = mount(BuildingExpensesEditTable, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
        })
        const snackbar = mount(AppSnackbar, {
          global: { plugins: [mockVuetify()] },
          attachTo: document.body,
          attrs: { attach: true },
        })
        await flushPromises()
        await table.get("tr.cursor-pointer td:nth-child(3)").trigger("click")
        const input = table.get<HTMLInputElement>("input")
        await input.setValue("125")
        await input.trigger("keydown", { key: "Tab" })
        await flushPromises()

        // Act
        const keepEditing = snackbar.get("button")
        await keepEditing.trigger("mousedown")
        await keepEditing.trigger("click")
        await flushPromises()

        // Assert
        expect(update).toHaveBeenCalledTimes(1)
      })
    })
  })
})
