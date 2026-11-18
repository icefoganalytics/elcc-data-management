import { effectScope, ref } from "vue"
import { flushPromises } from "@vue/test-utils"

import httpClient from "@/api/http-client"

import { administrationCostCategoryFactory } from "@/tests/factories"

import useAdministrationCostCategory from "@/use/use-administration-cost-category"
import useChildCareSpaceCategory from "@/use/use-child-care-space-category"
import useQualityEnhancementCategory from "@/use/use-quality-enhancement-category"

const programs = [
  {
    source: "web/src/use/use-administration-cost-category.ts",
    composable: "useAdministrationCostCategory",
    load: useAdministrationCostCategory,
    recordName: "administrationCostCategory",
    endpoint: "/api/administration-cost-categories/42",
  },
  {
    source: "web/src/use/use-child-care-space-category.ts",
    composable: "useChildCareSpaceCategory",
    load: useChildCareSpaceCategory,
    recordName: "childCareSpaceCategory",
    endpoint: "/api/child-care-space-categories/42",
  },
  {
    source: "web/src/use/use-quality-enhancement-category.ts",
    composable: "useQualityEnhancementCategory",
    load: useQualityEnhancementCategory,
    recordName: "qualityEnhancementCategory",
    endpoint: "/api/quality-enhancement-categories/42",
  },
]

for (const program of programs) {
  describe(program.source, () => {
    describe(program.composable, () => {
      describe("saving program rates", () => {
        test("when shared display metadata is loaded, saves only the exact program rate", async ({
          onTestFinished,
        }) => {
          // Arrange
          const category = {
            ...administrationCostCategoryFactory.build({
              id: 42,
              childCareCategoryId: 7,
              categoryName: "Shared infants",
              fromAge: 0,
              toAge: 1,
              monthlyAmount: "42.1234",
            }),
            deletedAt: null,
          }
          const response = {
            data: {
              [program.recordName]: category,
              policy: { update: true },
            },
          }
          vi.mocked(httpClient, true).get.mockResolvedValue(response)
          vi.mocked(httpClient, true).patch.mockResolvedValue(response)
          const scope = effectScope()
          onTestFinished(() => scope.stop())
          const model = scope.run(() => program.load(ref(42)))
          if (model === undefined) throw new Error("Category scope did not start")
          await flushPromises()

          // Act
          await model.save()

          // Assert
          expect(httpClient.patch).toHaveBeenCalledExactlyOnceWith(program.endpoint, {
            monthlyAmount: "42.1234",
          })
        })
      })
    })
  })
}
