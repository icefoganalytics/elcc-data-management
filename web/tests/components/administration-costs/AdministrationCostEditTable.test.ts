import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import administrationCostsApi from "@/api/administration-costs-api"
import { administrationCostFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"
import AdministrationCostEditTable from "@/components/administration-costs/AdministrationCostEditTable.vue"

describe("web/src/components/administration-costs/AdministrationCostEditTable.vue", () => {
  describe("AdministrationCostEditTable", () => {
    describe("#commitEdit", () => {
      test("when a failed save is still reloading, keeps the table busy until recovery settles", async () => {
        // Arrange
        const record = administrationCostFactory.build()
        const pendingReload = Promise.withResolvers<{
          administrationCosts: (typeof record)[]
          totalCount: number
        }>()
        vi.spyOn(administrationCostsApi, "list")
          .mockResolvedValueOnce({ administrationCosts: [record], totalCount: 1 })
          .mockReturnValueOnce(pendingReload.promise)
        vi.spyOn(administrationCostsApi, "update").mockRejectedValue(new Error("Save unavailable"))
        const wrapper = mount(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        const input = wrapper.get('input[inputmode="decimal"]')
        await input.setValue("0.25")

        // Act
        void wrapper.vm.commitEdit()
        await flushPromises()

        // Assert
        expect(wrapper.get(".v-data-table").attributes("aria-busy")).toEqual("true")
      })

      test("when an active edit is saving, waits for its write before reporting success", async () => {
        // Arrange
        const record = administrationCostFactory.build()
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [record],
          totalCount: 1,
        })
        const update = Promise.withResolvers<{
          administrationCost: typeof record
          policy: typeof record.policy
        }>()
        vi.spyOn(administrationCostsApi, "update").mockReturnValue(update.promise)
        const wrapper = mount(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act & Assert
        let committed: boolean | undefined
        const commit = wrapper.vm.commitEdit().then((result) => {
          committed = result
          return result
        })
        await flushPromises()
        expect(committed).toBeUndefined()
        update.resolve({
          administrationCost: { ...record, estimatedChildOccupancyRate: "0.25" },
          policy: record.policy,
        })
        await expect(commit).resolves.toEqual(true)
      })

      test("when the active write fails, reports failure to the worksheet workflow", async () => {
        // Arrange
        const record = administrationCostFactory.build()
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [record],
          totalCount: 1,
        })
        vi.spyOn(administrationCostsApi, "update").mockRejectedValue(new Error("Save unavailable"))
        const wrapper = mount(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act & Assert
        await expect(wrapper.vm.commitEdit()).resolves.toEqual(false)
      })

      test("when another row is selected, saves the previous row's occupancy edit", async () => {
        // Arrange
        const record1 = administrationCostFactory.build({ id: 1 })
        const record2 = administrationCostFactory.build({ id: 2 })
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [record1, record2],
          totalCount: 2,
        })
        vi.spyOn(administrationCostsApi, "update").mockResolvedValue({
          administrationCost: { ...record1, estimatedChildOccupancyRate: "0.25" },
          policy: record1.policy,
        })
        const wrapper = mount(AdministrationCostEditTable, {
          props: { where: { centreId: record1.centreId, fiscalPeriodId: record1.fiscalPeriodId } },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()
        const rows = wrapper.findAll("tr.cursor-pointer")
        await rows[0].trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act
        await rows[1].trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.get("tr.cursor-pointer td:nth-child(3)").text()).toEqual("0.25")
      })

      test("when replication failed but reload succeeded, allows a later worksheet save", async () => {
        // Arrange
        const record = administrationCostFactory.build()
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [record],
          totalCount: 1,
        })
        vi.spyOn(administrationCostsApi, "replicateEstimates").mockRejectedValue(
          new Error("Replication unavailable")
        )
        const wrapper = mount(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.vm.replicateEstimates().catch(() => undefined)

        // Assert
        await expect(wrapper.vm.commitEdit()).resolves.toEqual(true)
      })
    })

    describe("#refresh", () => {
      test("when a refresh fails, prevents replication of stale rows", async () => {
        // Arrange
        const record = administrationCostFactory.build()
        vi.spyOn(administrationCostsApi, "list")
          .mockResolvedValueOnce({ administrationCosts: [record], totalCount: 1 })
          .mockRejectedValueOnce(new Error("Refresh unavailable"))
        const replicate = vi.spyOn(administrationCostsApi, "replicateEstimates")
        const wrapper = mount(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.vm.refresh().catch(() => undefined)
        await wrapper.vm.replicateEstimates()

        // Assert
        expect(replicate).not.toHaveBeenCalled()
      })

      test("when retry succeeds after a failed refresh, allows the next occupancy edit", async () => {
        // Arrange
        const record = administrationCostFactory.build()
        vi.spyOn(administrationCostsApi, "list")
          .mockResolvedValueOnce({ administrationCosts: [record], totalCount: 1 })
          .mockRejectedValueOnce(new Error("Refresh unavailable"))
          .mockResolvedValue({ administrationCosts: [record], totalCount: 1 })
        vi.spyOn(administrationCostsApi, "update").mockResolvedValue({
          administrationCost: { ...record, estimatedChildOccupancyRate: "0.25" },
          policy: record.policy,
        })
        const wrapper = mount(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()
        await wrapper.vm.refresh().catch(() => undefined)
        await flushPromises()

        // Act
        await wrapper.get(".v-alert button").trigger("click")
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        const input = wrapper.get('input[inputmode="decimal"]')
        await input.setValue("0.25")
        await input.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Assert
        expect(wrapper.get("tr.cursor-pointer td:nth-child(3)").text()).toEqual("0.25")
      })
    })

    describe("#reload", () => {
      test("when a failed write is reloaded, preserves its failure and permits the next worksheet save", async () => {
        // Arrange
        const record = administrationCostFactory.build()
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [record],
          totalCount: 1,
        })
        vi.spyOn(administrationCostsApi, "update").mockRejectedValue(new Error("Write unavailable"))
        const wrapper = mount(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act & Assert
        await expect(wrapper.vm.commitEdit()).resolves.toEqual(false)
        await wrapper.get(".v-alert button").trigger("click")
        await flushPromises()
        await expect(wrapper.vm.commitEdit()).resolves.toEqual(true)
      })
    })

    describe("#replicateEstimates", () => {
      test("when the first category replication is pending, does not dispatch the next category", async () => {
        // Arrange
        const record1 = administrationCostFactory.build({ id: 1 })
        const record2 = administrationCostFactory.build({ id: 2 })
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [record1, record2],
          totalCount: 2,
        })
        const firstReplication = Promise.withResolvers<void>()
        const replicate = vi
          .spyOn(administrationCostsApi, "replicateEstimates")
          .mockReturnValue(firstReplication.promise)
        const wrapper = mount(AdministrationCostEditTable, {
          props: { where: { centreId: record1.centreId, fiscalPeriodId: record1.fiscalPeriodId } },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()

        // Act
        void wrapper.vm.replicateEstimates()
        await flushPromises()

        // Assert
        expect(replicate).toHaveBeenCalledExactlyOnceWith(record1.id)
      })
    })
  })
})
