import { effectScope, ref } from "vue"
import { flushPromises } from "@vue/test-utils"

import childrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"
import type {
  ChildrenWithDiverseNeedsFundingRecordAsShow,
  ChildrenWithDiverseNeedsFundingRecordPolicy,
} from "@/api/children-with-diverse-needs-funding-records-api"

import { childrenWithDiverseNeedsFundingRecordFactory } from "@/tests/factories"

import useChildrenWithDiverseNeedsFundingRecord from "@/use/use-children-with-diverse-needs-funding-record"

describe("web/src/use/use-children-with-diverse-needs-funding-record.ts", () => {
  describe("useChildrenWithDiverseNeedsFundingRecord", () => {
    describe("identity changes", () => {
      test("when a committed save finishes after navigation, retains the newly selected record", async ({
        onTestFinished,
      }) => {
        // Arrange
        const firstRecord = childrenWithDiverseNeedsFundingRecordFactory.build({ id: 1 })
        const secondRecord = childrenWithDiverseNeedsFundingRecordFactory.build({
          id: 2,
          fiscalPeriodId: 2,
        })
        const pendingSave = Promise.withResolvers<{
          childrenWithDiverseNeedsFundingRecord: ChildrenWithDiverseNeedsFundingRecordAsShow
          policy: ChildrenWithDiverseNeedsFundingRecordPolicy
        }>()
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "get")
          .mockResolvedValueOnce({
            childrenWithDiverseNeedsFundingRecord: firstRecord,
            policy: firstRecord.policy,
          })
          .mockResolvedValueOnce({
            childrenWithDiverseNeedsFundingRecord: secondRecord,
            policy: secondRecord.policy,
          })
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "update").mockReturnValueOnce(
          pendingSave.promise
        )
        const recordId = ref<number | null>(1)
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const record = scope.run(() => useChildrenWithDiverseNeedsFundingRecord(recordId))
        if (record === undefined) throw new Error("Record scope did not start")

        await flushPromises()
        const save = record.save({ actualChildOccupancyRate: "3.0000" })

        // Act
        recordId.value = 2
        await flushPromises()
        pendingSave.resolve({
          childrenWithDiverseNeedsFundingRecord: {
            ...firstRecord,
            actualChildOccupancyRate: "3.0000",
          },
          policy: firstRecord.policy,
        })
        await save

        // Assert
        expect(record.childrenWithDiverseNeedsFundingRecord.value).toEqual(secondRecord)
      })

      test("when a different record is selected before it loads, rejects saving the previous record", async ({
        onTestFinished,
      }) => {
        // Arrange
        const firstRecord = childrenWithDiverseNeedsFundingRecordFactory.build({ id: 1 })
        const pendingLoad = Promise.withResolvers<{
          childrenWithDiverseNeedsFundingRecord: ChildrenWithDiverseNeedsFundingRecordAsShow
          policy: ChildrenWithDiverseNeedsFundingRecordPolicy
        }>()
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "get")
          .mockResolvedValueOnce({
            childrenWithDiverseNeedsFundingRecord: firstRecord,
            policy: firstRecord.policy,
          })
          .mockReturnValueOnce(pendingLoad.promise)
        const recordId = ref<number | null>(1)
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const record = scope.run(() => useChildrenWithDiverseNeedsFundingRecord(recordId))
        if (record === undefined) throw new Error("Record scope did not start")

        await flushPromises()
        recordId.value = 2
        await flushPromises()

        // Act / Assert
        await expect(record.save({ actualChildOccupancyRate: "3.0000" })).rejects.toThrow(
          "The requested Children with Diverse Needs funding record is not loaded"
        )
      })

      test("when selection is cleared during a pending read, does not restore the old record", async ({
        onTestFinished,
      }) => {
        // Arrange
        const firstRecord = childrenWithDiverseNeedsFundingRecordFactory.build({ id: 1 })
        const pendingLoad = Promise.withResolvers<{
          childrenWithDiverseNeedsFundingRecord: ChildrenWithDiverseNeedsFundingRecordAsShow
          policy: ChildrenWithDiverseNeedsFundingRecordPolicy
        }>()
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "get").mockReturnValueOnce(
          pendingLoad.promise
        )
        const recordId = ref<number | null>(1)
        const scope = effectScope()
        onTestFinished(() => scope.stop())
        const record = scope.run(() => useChildrenWithDiverseNeedsFundingRecord(recordId))
        if (record === undefined) throw new Error("Record scope did not start")

        // Act
        recordId.value = null
        await flushPromises()
        pendingLoad.resolve({
          childrenWithDiverseNeedsFundingRecord: firstRecord,
          policy: firstRecord.policy,
        })
        await flushPromises()

        // Assert
        expect(record.childrenWithDiverseNeedsFundingRecord.value).toBeNull()
      })
    })
  })
})
