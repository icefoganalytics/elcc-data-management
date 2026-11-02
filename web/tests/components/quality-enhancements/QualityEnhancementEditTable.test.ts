import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import qualityEnhancementsApi from "@/api/quality-enhancements-api"
import { qualityEnhancementFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"
import QualityEnhancementEditTable from "@/components/quality-enhancements/QualityEnhancementEditTable.vue"

describe("web/src/components/quality-enhancements/QualityEnhancementEditTable.vue", () => {
  describe("QualityEnhancementEditTable", () => {
    describe("#commitEdit", () => {
      test("when a failed save is still reloading, keeps the table busy until recovery settles", async () => {
        // Arrange
        const record = qualityEnhancementFactory.build()
        const pendingReload = Promise.withResolvers<{
          qualityEnhancements: (typeof record)[]
          totalCount: number
        }>()
        vi.spyOn(qualityEnhancementsApi, "list")
          .mockResolvedValueOnce({ qualityEnhancements: [record], totalCount: 1 })
          .mockReturnValueOnce(pendingReload.promise)
        vi.spyOn(qualityEnhancementsApi, "update").mockRejectedValue(new Error("Save unavailable"))
        const wrapper = mount(QualityEnhancementEditTable, {
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
        const record = qualityEnhancementFactory.build()
        vi.spyOn(qualityEnhancementsApi, "list").mockResolvedValue({
          qualityEnhancements: [record],
          totalCount: 1,
        })
        const update = Promise.withResolvers<{
          qualityEnhancement: typeof record
          policy: typeof record.policy
        }>()
        vi.spyOn(qualityEnhancementsApi, "update").mockReturnValue(update.promise)
        const wrapper = mount(QualityEnhancementEditTable, {
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
          qualityEnhancement: { ...record, estimatedChildOccupancyRate: "0.25" },
          policy: record.policy,
        })
        await expect(commit).resolves.toEqual(true)
      })

      test("when the active write fails, reports failure to the worksheet workflow", async () => {
        // Arrange
        const record = qualityEnhancementFactory.build()
        vi.spyOn(qualityEnhancementsApi, "list").mockResolvedValue({
          qualityEnhancements: [record],
          totalCount: 1,
        })
        vi.spyOn(qualityEnhancementsApi, "update").mockRejectedValue(new Error("Save unavailable"))
        const wrapper = mount(QualityEnhancementEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [createPinia(), mockVuetify()] },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act & Assert
        await expect(wrapper.vm.commitEdit()).resolves.toEqual(false)
      })
    })

    describe("#refresh", () => {
      test("when a refresh fails, prevents replication of stale rows", async () => {
        // Arrange
        const record = qualityEnhancementFactory.build()
        vi.spyOn(qualityEnhancementsApi, "list")
          .mockResolvedValueOnce({ qualityEnhancements: [record], totalCount: 1 })
          .mockRejectedValueOnce(new Error("Refresh unavailable"))
        const replicate = vi.spyOn(qualityEnhancementsApi, "replicateEstimates")
        const wrapper = mount(QualityEnhancementEditTable, {
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
        const record = qualityEnhancementFactory.build()
        vi.spyOn(qualityEnhancementsApi, "list")
          .mockResolvedValueOnce({ qualityEnhancements: [record], totalCount: 1 })
          .mockRejectedValueOnce(new Error("Refresh unavailable"))
          .mockResolvedValue({ qualityEnhancements: [record], totalCount: 1 })
        vi.spyOn(qualityEnhancementsApi, "update").mockResolvedValue({
          qualityEnhancement: { ...record, estimatedChildOccupancyRate: "0.25" },
          policy: record.policy,
        })
        const wrapper = mount(QualityEnhancementEditTable, {
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
        const record = qualityEnhancementFactory.build()
        vi.spyOn(qualityEnhancementsApi, "list").mockResolvedValue({
          qualityEnhancements: [record],
          totalCount: 1,
        })
        vi.spyOn(qualityEnhancementsApi, "update").mockRejectedValue(new Error("Write unavailable"))
        const wrapper = mount(QualityEnhancementEditTable, {
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
        const record1 = qualityEnhancementFactory.build({ id: 1 })
        const record2 = qualityEnhancementFactory.build({ id: 2 })
        vi.spyOn(qualityEnhancementsApi, "list").mockResolvedValue({
          qualityEnhancements: [record1, record2],
          totalCount: 2,
        })
        const firstReplication = Promise.withResolvers<void>()
        const replicate = vi
          .spyOn(qualityEnhancementsApi, "replicateEstimates")
          .mockReturnValue(firstReplication.promise)
        const wrapper = mount(QualityEnhancementEditTable, {
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
