import { flushPromises, mount } from "@vue/test-utils"

import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import childrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"

import { childrenWithDiverseNeedsFundingRecordFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual from "@/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual.vue"

describe("web/src/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual", () => {
    describe("#commitEdit", () => {
      test("when estimated occupancy is edited and committed, persists it through the diverse needs API", async () => {
        // Arrange
        const childrenWithDiverseNeedsFundingRecord =
          childrenWithDiverseNeedsFundingRecordFactory.build()
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "list").mockResolvedValue({
          childrenWithDiverseNeedsFundingRecords: [childrenWithDiverseNeedsFundingRecord],
          totalCount: 1,
        })
        const update = vi
          .spyOn(childrenWithDiverseNeedsFundingRecordsApi, "update")
          .mockResolvedValue({
            childrenWithDiverseNeedsFundingRecord: {
              ...childrenWithDiverseNeedsFundingRecord,
              estimatedChildOccupancyRate: "0.2500",
              estimatedComputedTotal: "13.7400",
            },
            policy: childrenWithDiverseNeedsFundingRecord.policy,
          })
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual, {
          props: {
            where: {
              centreId: childrenWithDiverseNeedsFundingRecord.centreId,
              fiscalPeriodId: childrenWithDiverseNeedsFundingRecord.fiscalPeriodId,
            },
          },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        const input = wrapper.get('input[inputmode="decimal"]')
        await input.setValue("0.2500")
        await input.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Assert
        expect(update).toHaveBeenCalledWith(childrenWithDiverseNeedsFundingRecord.id, {
          estimatedChildOccupancyRate: "0.2500",
        })
      })

      test("when an occupancy save requires authentication, forwards the original error to Vue", async () => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build()
        const authenticationError = new AuthenticationRequiredError()
        const errors: unknown[] = []
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "list").mockResolvedValue({
          childrenWithDiverseNeedsFundingRecords: [record],
          totalCount: 1,
        })
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "update").mockRejectedValue(
          authenticationError
        )
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual, {
          props: {
            where: {
              centreId: record.centreId,
              fiscalPeriodId: record.fiscalPeriodId,
            },
          },
          global: {
            plugins: [mockVuetify()],
            config: { errorHandler: (error) => errors.push(error) },
          },
        })
        await flushPromises()

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        const input = wrapper.get('input[inputmode="decimal"]')
        await input.setValue("0.2500")
        await input.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Assert
        expect(errors).toEqual([authenticationError])
      })

      test("when an occupancy save is rejected as an operation error, shows local recovery feedback", async () => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build()
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "list").mockResolvedValue({
          childrenWithDiverseNeedsFundingRecords: [record],
          totalCount: 1,
        })
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "update").mockRejectedValue(
          new ApiOperationError("Occupancy is not permitted", 422)
        )
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual, {
          global: {
            plugins: [mockVuetify()],
          },
        })
        await flushPromises()

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        const input = wrapper.get('input[inputmode="decimal"]')
        await input.setValue("0.2500")
        await input.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Assert
        expect(wrapper.get('[role="alert"]').text()).toContain("Retry your edit after reloading.")
      })

      test("when an occupancy save is rejected as an operation error, keeps recovery local", async () => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build()
        const errorHandler = vi.fn()
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "list").mockResolvedValue({
          childrenWithDiverseNeedsFundingRecords: [record],
          totalCount: 1,
        })
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "update").mockRejectedValue(
          new ApiOperationError("Occupancy is not permitted", 422)
        )
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual, {
          global: {
            plugins: [mockVuetify()],
            config: { errorHandler },
          },
        })
        await flushPromises()

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        const input = wrapper.get('input[inputmode="decimal"]')
        await input.setValue("0.2500")
        await input.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Assert
        expect(errorHandler).not.toHaveBeenCalled()
      })

      test("when an occupancy save is pending, disables record deletion", async () => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build({
          policy: { destroy: true },
        })
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "list").mockResolvedValue({
          childrenWithDiverseNeedsFundingRecords: [record],
          totalCount: 1,
        })
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "update").mockReturnValue(
          new Promise(() => {})
        )
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual, {
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.get("tr.cursor-pointer").trigger("click")
        const input = wrapper.get('input[inputmode="decimal"]')
        await input.setValue("0.2500")
        await input.trigger("keydown", { key: "Enter" })
        await flushPromises()

        // Assert
        expect(wrapper.get("button").attributes("disabled")).toBeDefined()
      })
    })

    describe("load recovery", () => {
      test("when a failed load is retried, displays the returned funding records", async () => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build({
          lineName: "Historical support",
        })
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "list")
          .mockRejectedValueOnce(new ApiOperationError("Unavailable", 503))
          .mockResolvedValueOnce({
            childrenWithDiverseNeedsFundingRecords: [record],
            totalCount: 1,
          })
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual, {
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.get('[role="alert"] button').trigger("click")
        await flushPromises()

        // Assert
        expect(wrapper.get("tbody tr.cursor-pointer").text()).toContain("Historical support")
      })

      test("when refreshing loaded records fails, hides the stale editable rows", async () => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build()
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "list")
          .mockResolvedValueOnce({
            childrenWithDiverseNeedsFundingRecords: [record],
            totalCount: 1,
          })
          .mockRejectedValueOnce(new ApiOperationError("Unavailable", 503))
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual, {
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()

        // Act
        await wrapper.vm.refresh().catch(() => undefined)
        await flushPromises()

        // Assert
        expect(wrapper.findAll("tbody tr.cursor-pointer")).toEqual([])
      })

      test("when refreshing loaded records fails, rejects with the load failure", async () => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build()
        const loadFailure = new ApiOperationError("Unavailable", 503)
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "list")
          .mockResolvedValueOnce({
            childrenWithDiverseNeedsFundingRecords: [record],
            totalCount: 1,
          })
          .mockRejectedValueOnce(loadFailure)
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditDataTableVirtual, {
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()

        // Act
        const refresh = wrapper.vm.refresh()

        // Assert
        await expect(refresh).rejects.toBe(loadFailure)
      })
    })
  })
})
