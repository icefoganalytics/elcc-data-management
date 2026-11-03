import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import diverseNeedsApi from "@/api/diverse-needs-api"
import { diverseNeedFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import DiverseNeedEditTable from "@/components/diverse-needs/DiverseNeedEditTable.vue"

describe("web/src/components/diverse-needs/DiverseNeedEditTable.vue", () => {
  describe("DiverseNeedEditTable", () => {
    describe("#commitEdit", () => {
      test("when estimated occupancy is edited and committed, persists it through the diverse needs API", async () => {
        // Arrange
        const diverseNeed = diverseNeedFactory.build()
        vi.spyOn(diverseNeedsApi, "list").mockResolvedValue({
          diverseNeeds: [diverseNeed],
          totalCount: 1,
        })
        const update = vi.spyOn(diverseNeedsApi, "update").mockResolvedValue({
          diverseNeed: {
            ...diverseNeed,
            estimatedChildOccupancyRate: "0.2500",
            estimatedComputedTotal: "13.7400",
          },
          policy: diverseNeed.policy,
        })
        const wrapper = mount(DiverseNeedEditTable, {
          props: {
            where: { centreId: diverseNeed.centreId, fiscalPeriodId: diverseNeed.fiscalPeriodId },
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
        expect(update).toHaveBeenCalledWith(diverseNeed.id, {
          estimatedChildOccupancyRate: "0.2500",
        })
      })
    })
  })
})
