import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import childrenWithChildrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"
import { childrenWithChildrenWithDiverseNeedsFundingRecordsRecordFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingRecordsEditTable from "@/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsEditTable.vue"

describe("web/src/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsEditTable.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingRecordsEditTable", () => {
    describe("#commitEdit", () => {
      test("when estimated occupancy is edited and committed, persists it through the Children with Diverse Needs API", async () => {
        // Arrange
        const childrenWithChildrenWithDiverseNeedsFundingRecordsRecord = childrenWithChildrenWithDiverseNeedsFundingRecordsRecordFactory.build()
        vi.spyOn(childrenWithChildrenWithDiverseNeedsFundingRecordsApi, "list").mockResolvedValue({
          childrenWithChildrenWithDiverseNeedsFundingRecordsRecords: [childrenWithChildrenWithDiverseNeedsFundingRecordsRecord],
          totalCount: 1,
        })
        const update = vi.spyOn(childrenWithChildrenWithDiverseNeedsFundingRecordsApi, "update").mockResolvedValue({
          childrenWithChildrenWithDiverseNeedsFundingRecordsRecord: {
            ...childrenWithChildrenWithDiverseNeedsFundingRecordsRecord,
            estimatedChildOccupancyRate: "0.2500",
            estimatedComputedTotal: "13.7400",
          },
          policy: childrenWithChildrenWithDiverseNeedsFundingRecordsRecord.policy,
        })
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsEditTable, {
          props: {
            where: {
              centreId: childrenWithChildrenWithDiverseNeedsFundingRecordsRecord.centreId,
              fiscalPeriodId: childrenWithChildrenWithDiverseNeedsFundingRecordsRecord.fiscalPeriodId,
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
        expect(update).toHaveBeenCalledWith(childrenWithChildrenWithDiverseNeedsFundingRecordsRecord.id, {
          estimatedChildOccupancyRate: "0.2500",
        })
      })
    })
  })
})
