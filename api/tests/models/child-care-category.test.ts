import { childCareCategoryFactory, fundingPeriodFactory } from "@/factories"

describe("api/src/models/child-care-category.ts", () => {
  describe("ChildCareCategory", () => {
    describe("#validateFundingPeriodIdentity", () => {
      test("rejects moving a shared category to another funding period", async () => {
        const childCareCategory = await childCareCategoryFactory.create()
        const fundingPeriod = await fundingPeriodFactory.create()

        const update = childCareCategory.update({ fundingPeriodId: fundingPeriod.id })

        await expect(update).rejects.toThrow("Funding period cannot be changed")
      })
    })
  })
})
