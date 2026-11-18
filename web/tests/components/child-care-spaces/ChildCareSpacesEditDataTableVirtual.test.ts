import { DOMWrapper, flushPromises } from "@vue/test-utils"

import childCareSpacesApi from "@/api/child-care-spaces-api"
import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"

import useSnack from "@/use/use-snack"
import AppSnackbar from "@/components/layouts/AppSnackbar.vue"

import { childCareSpaceFactory, childCareSpaceSummariesFactory } from "@/tests/factories"
import { mountWithDefaultPlugins } from "@/tests/support"

import ChildCareSpacesEditDataTableVirtual from "@/components/child-care-spaces/ChildCareSpacesEditDataTableVirtual.vue"

describe("web/src/components/child-care-spaces/ChildCareSpacesEditDataTableVirtual.vue", () => {
  describe("ChildCareSpacesEditDataTableVirtual", () => {
    describe("#commitEdit", () => {
      test("when actual occupancy is committed, saves only the changed occupancy field", async () => {
        // Arrange
        const childCareSpace = childCareSpaceFactory.build({
          id: 17,
          estimatedChildOccupancyRate: "2.0000",
        })
        const policy = { show: true, create: false, update: true, destroy: false }
        vi.spyOn(childCareSpacesApi, "list").mockResolvedValue({
          summaries: childCareSpaceSummariesFactory.build(),
          childCareSpaces: [{ ...childCareSpace, policy }],
          totalCount: 1,
        })
        const update = vi.spyOn(childCareSpacesApi, "update").mockResolvedValue({
          childCareSpace: {
            ...childCareSpace,
            actualChildOccupancyRate: "1.2500",
            actualComputedTotal: "125.0000",
          },
          policy,
        })
        const wrapper = mountWithDefaultPlugins(ChildCareSpacesEditDataTableVirtual, {
          props: {
            where: {
              centreId: childCareSpace.centreId,
              fiscalPeriodId: childCareSpace.fiscalPeriodId,
            },
          },
        })
        await flushPromises()

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.findAll('input[inputmode="decimal"]')[1].setValue("1.2500")
        await wrapper.vm.commitEdit()

        // Assert
        expect(update).toHaveBeenCalledWith(17, { actualChildOccupancyRate: "1.2500" })
      })

      test("when a save refreshes Spaces, displays the API summary rather than the row total in the section footer", async () => {
        // Arrange
        const childCareSpace = childCareSpaceFactory.build({ monthlyAmount: "100.0000" })
        const updatedChildCareSpace = {
          ...childCareSpace,
          estimatedChildOccupancyRate: "1.2500",
          estimatedComputedTotal: "137.4900",
        }
        const policy = { show: true, create: false, update: true, destroy: false }
        vi.spyOn(childCareSpacesApi, "list")
          .mockResolvedValueOnce({
            childCareSpaces: [{ ...childCareSpace, policy }],
            totalCount: 1,
            summaries: childCareSpaceSummariesFactory.build(),
          })
          .mockResolvedValue({
            childCareSpaces: [{ ...updatedChildCareSpace, policy }],
            totalCount: 1,
            summaries: childCareSpaceSummariesFactory.build({
              totalEstimated: "246.8100",
              totalEstimatedOccupancy: "1.2500",
            }),
          })
        vi.spyOn(childCareSpacesApi, "update").mockResolvedValue({
          childCareSpace: updatedChildCareSpace,
          policy,
        })
        const wrapper = mountWithDefaultPlugins(ChildCareSpacesEditDataTableVirtual)
        await flushPromises()

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("1.2500")
        await wrapper.vm.commitEdit()
        await flushPromises()

        // Assert
        expect(wrapper.get("tfoot").text()).toContain("246.81")
      })

      test("when Spaces summaries are still refreshing, keeps the table saving", async () => {
        // Arrange
        const childCareSpace = childCareSpaceFactory.build()
        const policy = { show: true, create: false, update: true, destroy: false }
        vi.spyOn(childCareSpacesApi, "list").mockResolvedValue({
          summaries: childCareSpaceSummariesFactory.build(),
          childCareSpaces: [{ ...childCareSpace, policy }],
          totalCount: 1,
        })
        vi.spyOn(childCareSpacesApi, "update").mockResolvedValue({
          childCareSpace: { ...childCareSpace, estimatedChildOccupancyRate: "1.2500" },
          policy,
        })
        const { promise: pendingRefresh, resolve: finishRefresh } =
          Promise.withResolvers<Awaited<ReturnType<typeof childCareSpacesApi.list>>>()
        const wrapper = mountWithDefaultPlugins(ChildCareSpacesEditDataTableVirtual)
        await flushPromises()
        vi.mocked(childCareSpacesApi.list).mockReturnValueOnce(pendingRefresh)

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("1.2500")
        const commit = wrapper.vm.commitEdit()
        await flushPromises()

        // Assert
        try {
          expect(wrapper.vm.isSaving).toBe(true)
        } finally {
          finishRefresh({
            childCareSpaces: [{ ...childCareSpace, policy }],
            totalCount: 1,
            summaries: childCareSpaceSummariesFactory.build(),
          })
          await commit
        }
      })

      test("when occupancy is rejected, reports an unsuccessful commit", async () => {
        // Arrange
        const childCareSpace = childCareSpaceFactory.build()
        const policy = { show: true, create: false, update: true, destroy: false }
        vi.spyOn(childCareSpacesApi, "list").mockResolvedValue({
          summaries: childCareSpaceSummariesFactory.build(),
          childCareSpaces: [{ ...childCareSpace, policy }],
          totalCount: 1,
        })
        vi.spyOn(childCareSpacesApi, "update").mockRejectedValue(
          new ApiOperationError("Occupancy is not permitted", 422)
        )
        const wrapper = mountWithDefaultPlugins(ChildCareSpacesEditDataTableVirtual)
        await flushPromises()

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("1.2500")

        // Assert
        await expect(wrapper.vm.commitEdit()).resolves.toBe(false)
      })

      test("when refreshing Spaces summaries fails, reports the saved write through a snackbar", async () => {
        // Arrange
        const childCareSpace = childCareSpaceFactory.build()
        const policy = { show: true, create: false, update: true, destroy: false }
        vi.spyOn(childCareSpacesApi, "list").mockResolvedValue({
          summaries: childCareSpaceSummariesFactory.build(),
          childCareSpaces: [{ ...childCareSpace, policy }],
          totalCount: 1,
        })
        vi.spyOn(childCareSpacesApi, "update").mockResolvedValue({
          childCareSpace: { ...childCareSpace, estimatedChildOccupancyRate: "1.2500" },
          policy,
        })
        vi.stubGlobal("visualViewport", undefined)
        const snack = useSnack()
        snack.reset()
        mountWithDefaultPlugins(AppSnackbar, { attachTo: document.body })
        const wrapper = mountWithDefaultPlugins(ChildCareSpacesEditDataTableVirtual)
        await flushPromises()
        vi.mocked(childCareSpacesApi.list).mockRejectedValueOnce(
          new ApiOperationError("Summaries are unavailable", 503)
        )

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        await wrapper.get('input[inputmode="decimal"]').setValue("1.2500")
        await wrapper.vm.commitEdit()
        await flushPromises()

        // Assert
        expect(new DOMWrapper(document.body).get(".v-snackbar").text()).toContain(
          "Child care spaces were saved, but their summaries could not be refreshed."
        )
      })
    })

    describe("keyboard editing", () => {
      test("when Escape cancels an occupancy edit, does not persist the canceled value", async () => {
        // Arrange
        const childCareSpace = childCareSpaceFactory.build()
        const policy = { show: true, create: false, update: true, destroy: false }
        vi.spyOn(childCareSpacesApi, "list").mockResolvedValue({
          summaries: childCareSpaceSummariesFactory.build(),
          childCareSpaces: [{ ...childCareSpace, policy }],
          totalCount: 1,
        })
        const update = vi.spyOn(childCareSpacesApi, "update")
        const wrapper = mountWithDefaultPlugins(ChildCareSpacesEditDataTableVirtual)
        await flushPromises()

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        const input = wrapper.get('input[inputmode="decimal"]')
        await input.setValue("1.2500")
        await input.trigger("keydown", { key: "Escape" })
        await wrapper.vm.commitEdit()

        // Assert
        expect(update).not.toHaveBeenCalled()
      })

      test("when a keyboard save requires authentication, forwards the original error to Vue", async () => {
        // Arrange
        const childCareSpace = childCareSpaceFactory.build()
        const policy = { show: true, create: false, update: true, destroy: false }
        const authenticationError = new AuthenticationRequiredError()
        const errors: unknown[] = []
        vi.spyOn(childCareSpacesApi, "list").mockResolvedValue({
          summaries: childCareSpaceSummariesFactory.build(),
          childCareSpaces: [{ ...childCareSpace, policy }],
          totalCount: 1,
        })
        vi.spyOn(childCareSpacesApi, "update").mockRejectedValue(authenticationError)
        const wrapper = mountWithDefaultPlugins(ChildCareSpacesEditDataTableVirtual, {
          apiResponseErrorHandling: false,
          global: {
            config: { errorHandler: (error) => errors.push(error) },
          },
        })
        await flushPromises()

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        const input = wrapper.get('input[inputmode="decimal"]')
        await input.setValue("1.2500")
        await input.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Assert
        expect(errors).toEqual([authenticationError])
      })
    })
  })
})
