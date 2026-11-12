import { DOMWrapper, flushPromises, mount } from "@vue/test-utils"
import { AxiosError } from "axios"

import qualityEnhancementsApi from "@/api/quality-enhancements-api"
import ApiOperationError from "@/api/errors/api-operation-error"
import apiResponseErrorPlugin from "@/plugins/api-response-error-plugin"
import useSnack from "@/use/use-snack"
import { qualityEnhancementFactory } from "@/tests/factories"
import { mockRouter, mockVuetify } from "@/tests/support"
import QualityEnhancementEditTable from "@/components/quality-enhancements/QualityEnhancementEditTable.vue"
import AppSnackbar from "@/components/layouts/AppSnackbar.vue"

describe("web/src/components/quality-enhancements/QualityEnhancementEditTable.vue", () => {
  describe("QualityEnhancementEditTable", () => {
    describe("#commitEdit", () => {
      test("when an autosave loses its network connection, shows unconfirmed-save feedback", async () => {
        // Arrange
        vi.stubGlobal("visualViewport", undefined)
        const snack = useSnack()
        snack.reset()
        const record = qualityEnhancementFactory.build()
        vi.spyOn(qualityEnhancementsApi, "list").mockResolvedValue({
          qualityEnhancements: [record],
          totalCount: 1,
        })
        vi.spyOn(qualityEnhancementsApi, "update").mockRejectedValue(
          new AxiosError("Network unavailable", "ERR_NETWORK")
        )
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/")
        await router.isReady()
        mount(AppSnackbar, { global: { plugins: [mockVuetify()] }, attachTo: document.body })
        const wrapper = mount(QualityEnhancementEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [router, mockVuetify(), apiResponseErrorPlugin] },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act
        await wrapper.get('input[inputmode="decimal"]').trigger("keydown", { key: "Tab" })
        await flushPromises()

        // Assert
        expect(new DOMWrapper(document.body).get(".v-snackbar").isVisible()).toBe(true)
      })

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
        vi.spyOn(qualityEnhancementsApi, "update").mockRejectedValue(
          new ApiOperationError("Save unavailable", 503)
        )
        const wrapper = mount(QualityEnhancementEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [mockVuetify()] },
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

      test("when an active edit is pending, waits for its write before reporting success", async () => {
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
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act
        let committed: boolean | undefined
        void wrapper.vm.commitEdit().then((result) => {
          committed = result
        })
        await flushPromises()

        // Assert
        expect(committed).toBeUndefined()
      })

      test("when an active edit finishes saving, reports success to the worksheet workflow", async () => {
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
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act
        const commit = wrapper.vm.commitEdit()
        update.resolve({
          qualityEnhancement: { ...record, estimatedChildOccupancyRate: "0.25" },
          policy: record.policy,
        })

        // Assert
        await expect(commit).resolves.toEqual(true)
      })

      test("when the active write fails, reports failure to the worksheet workflow", async () => {
        // Arrange
        const record = qualityEnhancementFactory.build()
        vi.spyOn(qualityEnhancementsApi, "list").mockResolvedValue({
          qualityEnhancements: [record],
          totalCount: 1,
        })
        vi.spyOn(qualityEnhancementsApi, "update").mockRejectedValue(
          new ApiOperationError("Save unavailable", 503)
        )
        const wrapper = mount(QualityEnhancementEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [mockVuetify()] },
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
          .mockRejectedValueOnce(new ApiOperationError("Refresh unavailable", 503))
        const replicate = vi.spyOn(qualityEnhancementsApi, "replicateEstimates")
        const wrapper = mount(QualityEnhancementEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [mockVuetify()] },
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
          .mockRejectedValueOnce(new ApiOperationError("Refresh unavailable", 503))
          .mockResolvedValue({ qualityEnhancements: [record], totalCount: 1 })
        vi.spyOn(qualityEnhancementsApi, "update").mockResolvedValue({
          qualityEnhancement: { ...record, estimatedChildOccupancyRate: "0.25" },
          policy: record.policy,
        })
        const wrapper = mount(QualityEnhancementEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [mockVuetify()] },
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
      test("when a failed write is reloaded, permits the next worksheet save", async () => {
        // Arrange
        const record = qualityEnhancementFactory.build()
        vi.spyOn(qualityEnhancementsApi, "list").mockResolvedValue({
          qualityEnhancements: [record],
          totalCount: 1,
        })
        vi.spyOn(qualityEnhancementsApi, "update").mockRejectedValue(
          new ApiOperationError("Write unavailable", 503)
        )
        const wrapper = mount(QualityEnhancementEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act
        await wrapper.vm.commitEdit()
        await wrapper.get(".v-alert button").trigger("click")
        await flushPromises()

        // Assert
        await expect(wrapper.vm.commitEdit()).resolves.toEqual(true)
      })
    })

    describe("#deleteRecord", () => {
      test.each([
        ["pending", false, false, 0],
        ["succeeds", true, false, 1],
        ["fails", true, true, 0],
      ] as const)(
        "when deleting another row while an active edit is %s, deletes only after write success",
        async (_outcome, finishWrite, failSave, expectedDeletes) => {
          // Arrange
          const first = qualityEnhancementFactory.build({ id: 1 })
          const second = qualityEnhancementFactory.build({
            id: 2,
            policy: { show: true, create: true, update: true, destroy: true },
          })
          vi.spyOn(window, "confirm").mockReturnValue(true)
          vi.spyOn(qualityEnhancementsApi, "list").mockResolvedValue({
            qualityEnhancements: [first, second],
            totalCount: 2,
          })
          const write = Promise.withResolvers<{
            qualityEnhancement: typeof first
            policy: typeof first.policy
          }>()
          vi.spyOn(qualityEnhancementsApi, "update").mockReturnValue(write.promise)
          const remove = vi.spyOn(qualityEnhancementsApi, "delete").mockResolvedValue(undefined)
          const wrapper = mount(QualityEnhancementEditTable, {
            props: { where: { centreId: first.centreId, fiscalPeriodId: first.fiscalPeriodId } },
            global: { plugins: [mockVuetify()] },
          })
          await flushPromises()
          const rows = wrapper.findAll("tr.cursor-pointer")
          const firstRow = rows[0]
          const secondRow = rows[1]
          if (!firstRow || !secondRow) throw new Error("Expected two monthly rows")
          await firstRow.trigger("click")
          await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

          // Act
          await secondRow.get("button").trigger("click")
          await flushPromises()

          if (finishWrite) {
            if (failSave) {
              write.reject(new ApiOperationError("Write unavailable", 503))
            } else {
              write.resolve({
                qualityEnhancement: { ...first, estimatedChildOccupancyRate: "0.25" },
                policy: first.policy,
              })
            }
          }
          await flushPromises()

          // Assert
          expect(remove).toHaveBeenCalledTimes(expectedDeletes)
        }
      )
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
          global: { plugins: [mockVuetify()] },
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
