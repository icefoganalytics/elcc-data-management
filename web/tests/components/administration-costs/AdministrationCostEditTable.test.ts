import { DOMWrapper, flushPromises } from "@vue/test-utils"
import { AxiosError } from "axios"

import administrationCostsApi from "@/api/administration-costs-api"
import ApiOperationError from "@/api/errors/api-operation-error"

import useSnack from "@/use/use-snack"

import { administrationCostFactory } from "@/tests/factories"
import { mountWithDefaultPlugins } from "@/tests/support"

import AppSnackbar from "@/components/layouts/AppSnackbar.vue"

import AdministrationCostEditTable from "@/components/administration-costs/AdministrationCostEditTable.vue"

describe("web/src/components/administration-costs/AdministrationCostEditTable.vue", () => {
  describe("AdministrationCostEditTable", () => {
    describe("#commitEdit", () => {
      test("when an autosave loses its network connection, shows unconfirmed-save feedback", async () => {
        // Arrange
        vi.stubGlobal("visualViewport", undefined)
        const snack = useSnack()
        snack.reset()
        const record = administrationCostFactory.build()
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [record],
          totalCount: 1,
        })
        vi.spyOn(administrationCostsApi, "update").mockRejectedValue(
          new AxiosError("Network unavailable", "ERR_NETWORK")
        )
        mountWithDefaultPlugins(AppSnackbar, { attachTo: document.body })
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
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
        const record = administrationCostFactory.build()
        const pendingReload = Promise.withResolvers<{
          administrationCosts: (typeof record)[]
          totalCount: number
        }>()
        vi.spyOn(administrationCostsApi, "list")
          .mockResolvedValueOnce({ administrationCosts: [record], totalCount: 1 })
          .mockReturnValueOnce(pendingReload.promise)
        vi.spyOn(administrationCostsApi, "update").mockRejectedValue(
          new ApiOperationError("Save unavailable", 503)
        )
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        const input = wrapper.get('input[inputmode="decimal"]')
        await input.setValue("0.25")

        // Act
        wrapper.vm.commitEdit()
        await flushPromises()

        // Assert
        expect(wrapper.get(".v-data-table").attributes("aria-busy")).toEqual("true")
      })

      test("when an active edit is pending, waits for its write before reporting success", async () => {
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
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act
        let committed: boolean | undefined
        wrapper.vm.commitEdit().then((result) => {
          committed = result
        })
        await flushPromises()

        // Assert
        expect(committed).toBeUndefined()
      })

      test("when an active edit finishes saving, reports success to the worksheet workflow", async () => {
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
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act
        const commit = wrapper.vm.commitEdit()
        update.resolve({
          administrationCost: { ...record, estimatedChildOccupancyRate: "0.25" },
          policy: record.policy,
        })

        // Assert
        await expect(commit).resolves.toEqual(true)
      })

      test("when the active write fails, reports failure to the worksheet workflow", async () => {
        // Arrange
        const record = administrationCostFactory.build()
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [record],
          totalCount: 1,
        })
        vi.spyOn(administrationCostsApi, "update").mockRejectedValue(
          new ApiOperationError("Save unavailable", 503)
        )
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
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
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: record1.centreId, fiscalPeriodId: record1.fiscalPeriodId } },
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
          new ApiOperationError("Replication unavailable", 503)
        )
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
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
          .mockRejectedValueOnce(new ApiOperationError("Refresh unavailable", 503))
        const replicate = vi.spyOn(administrationCostsApi, "replicateEstimates")
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
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
          .mockRejectedValueOnce(new ApiOperationError("Refresh unavailable", 503))
          .mockResolvedValue({ administrationCosts: [record], totalCount: 1 })
        vi.spyOn(administrationCostsApi, "update").mockResolvedValue({
          administrationCost: { ...record, estimatedChildOccupancyRate: "0.25" },
          policy: record.policy,
        })
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
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
        const record = administrationCostFactory.build()
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [record],
          totalCount: 1,
        })
        vi.spyOn(administrationCostsApi, "update").mockRejectedValue(
          new ApiOperationError("Write unavailable", 503)
        )
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: record.centreId, fiscalPeriodId: record.fiscalPeriodId } },
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
      test("when an active write is pending, waits before deleting another row", async () => {
        // Arrange
        const first = administrationCostFactory.build({ id: 1 })
        const second = administrationCostFactory.build({
          id: 2,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        vi.spyOn(window, "confirm").mockReturnValue(true)
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [first, second],
          totalCount: 2,
        })
        const write = Promise.withResolvers<{
          administrationCost: typeof first
          policy: typeof first.policy
        }>()
        vi.spyOn(administrationCostsApi, "update").mockReturnValue(write.promise)
        const remove = vi.spyOn(administrationCostsApi, "delete").mockResolvedValue(undefined)
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: first.centreId, fiscalPeriodId: first.fiscalPeriodId } },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act
        await wrapper.get("tr.cursor-pointer button").trigger("click")
        await flushPromises()

        // Assert
        expect(remove).not.toHaveBeenCalled()
      })

      test("when an active write succeeds, deletes the other row after saving", async () => {
        // Arrange
        const first = administrationCostFactory.build({ id: 1 })
        const second = administrationCostFactory.build({
          id: 2,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        vi.spyOn(window, "confirm").mockReturnValue(true)
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [first, second],
          totalCount: 2,
        })
        const write = Promise.withResolvers<{
          administrationCost: typeof first
          policy: typeof first.policy
        }>()
        vi.spyOn(administrationCostsApi, "update").mockReturnValue(write.promise)
        const remove = vi.spyOn(administrationCostsApi, "delete").mockResolvedValue(undefined)
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: first.centreId, fiscalPeriodId: first.fiscalPeriodId } },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act
        await wrapper.get("tr.cursor-pointer button").trigger("click")
        await flushPromises()
        write.resolve({
          administrationCost: { ...first, estimatedChildOccupancyRate: "0.25" },
          policy: first.policy,
        })
        await flushPromises()

        // Assert
        expect(remove).toHaveBeenCalledExactlyOnceWith(2)
      })

      test("when an active write fails, does not delete the other row", async () => {
        // Arrange
        const first = administrationCostFactory.build({ id: 1 })
        const second = administrationCostFactory.build({
          id: 2,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        vi.spyOn(window, "confirm").mockReturnValue(true)
        vi.spyOn(administrationCostsApi, "list").mockResolvedValue({
          administrationCosts: [first, second],
          totalCount: 2,
        })
        const write = Promise.withResolvers<{
          administrationCost: typeof first
          policy: typeof first.policy
        }>()
        vi.spyOn(administrationCostsApi, "update").mockReturnValue(write.promise)
        const remove = vi.spyOn(administrationCostsApi, "delete").mockResolvedValue(undefined)
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: first.centreId, fiscalPeriodId: first.fiscalPeriodId } },
        })
        await flushPromises()
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("0.25")

        // Act
        await wrapper.get("tr.cursor-pointer button").trigger("click")
        await flushPromises()
        write.reject(new ApiOperationError("Write unavailable", 503))
        await flushPromises()

        // Assert
        expect(remove).not.toHaveBeenCalled()
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
        const wrapper = mountWithDefaultPlugins(AdministrationCostEditTable, {
          props: { where: { centreId: record1.centreId, fiscalPeriodId: record1.fiscalPeriodId } },
        })
        await flushPromises()

        // Act
        wrapper.vm.replicateEstimates()
        await flushPromises()

        // Assert
        expect(replicate).toHaveBeenCalledExactlyOnceWith(1)
      })
    })
  })
})
