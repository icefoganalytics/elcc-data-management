import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import childrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"
import { childrenWithDiverseNeedsFundingRecordFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingRecordsEditTable from "@/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsEditTable.vue"

describe("web/src/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsEditTable.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingRecordsEditTable", () => {
    describe("#commitEdit", () => {
      test("when estimated occupancy is edited and committed, persists it through the Children with Diverse Needs API", async () => {
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
    })
  })
})
