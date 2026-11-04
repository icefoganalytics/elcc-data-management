import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import childrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"

import { childrenWithDiverseNeedsFundingRecordFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingRecordsEditTable from "@/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsEditTable.vue"

describe("web/src/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsEditTable.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingRecordsEditTable", () => {
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
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditTable, {
          props: {
            where: {
              centreId: childrenWithDiverseNeedsFundingRecord.centreId,
              fiscalPeriodId: childrenWithDiverseNeedsFundingRecord.fiscalPeriodId,
            },
          },
          global: { plugins: [createPinia(), mockVuetify()] },
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
        const errorHandler = vi.fn()
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "list").mockResolvedValue({
          childrenWithDiverseNeedsFundingRecords: [record],
          totalCount: 1,
        })
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "update").mockRejectedValue(
          authenticationError
        )
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditTable, {
          props: {
            where: {
              centreId: record.centreId,
              fiscalPeriodId: record.fiscalPeriodId,
            },
          },
          global: {
            plugins: [createPinia(), mockVuetify()],
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
        expect(errorHandler).toHaveBeenCalledWith(
          authenticationError,
          expect.anything(),
          expect.any(String)
        )
      })

      test("when an occupancy save is rejected as an operation error, shows local recovery feedback", async () => {
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
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditTable, {
          global: {
            plugins: [createPinia(), mockVuetify()],
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
        expect(wrapper.get('[role="alert"]').text()).toContain("Retry your edit after reloading.")
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
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditTable, {
          global: { plugins: [createPinia(), mockVuetify()] },
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
  })
})
