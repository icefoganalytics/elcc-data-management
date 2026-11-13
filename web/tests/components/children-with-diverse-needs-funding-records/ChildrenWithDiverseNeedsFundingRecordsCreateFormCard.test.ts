import { flushPromises, mount } from "@vue/test-utils"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"
import childrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"

import {
  childrenWithDiverseNeedsFundingCategoryFactory,
  childrenWithDiverseNeedsFundingRecordFactory,
} from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete.vue"

import ChildrenWithDiverseNeedsFundingRecordsCreateFormCard from "@/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsCreateFormCard.vue"

describe("web/src/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsCreateFormCard.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingRecordsCreateFormCard", () => {
    describe("#create", () => {
      test("when valid occupancies are submitted, preserves decimal strings in the creation payload", async () => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build({
          centreId: 11,
          fiscalPeriodId: 12,
          categoryId: 13,
        })
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: record.categoryId,
          fundingPeriodId: 3,
          categoryName: "Toddlers",
        })
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list").mockResolvedValue({
          childrenWithDiverseNeedsFundingCategories: [category],
          totalCount: 1,
        })
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "get").mockResolvedValue({
          childrenWithDiverseNeedsFundingCategory: category,
          policy: category.policy,
        })
        const create = vi
          .spyOn(childrenWithDiverseNeedsFundingRecordsApi, "create")
          .mockResolvedValue({
            childrenWithDiverseNeedsFundingRecord: record,
            policy: record.policy,
          })
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsCreateFormCard, {
          props: {
            centreId: record.centreId,
            fiscalPeriodId: record.fiscalPeriodId,
            fundingPeriodId: 3,
            existingCategoryIds: [],
          },
          global: { plugins: [mockVuetify()] },
        })
        await flushPromises()
        wrapper
          .getComponent(ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete)
          .vm.$emit("update:modelValue", record.categoryId)
        await flushPromises()
        const occupancyInputs = wrapper.findAll('input[inputmode="decimal"]')
        await occupancyInputs[0].setValue("0.2500")
        await occupancyInputs[1].setValue("0.1250")

        // Act
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Assert
        expect(create).toHaveBeenCalledWith({
          centreId: 11,
          fiscalPeriodId: 12,
          categoryId: 13,
          estimatedChildOccupancyRate: "0.2500",
          actualChildOccupancyRate: "0.1250",
          applyToCurrentAndFutureFiscalPeriods: false,
        })
      })

      test("when creation requires authentication, forwards the original error to Vue", async () => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build({
          centreId: 11,
          fiscalPeriodId: 12,
          categoryId: 13,
        })
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: record.categoryId,
          fundingPeriodId: 3,
          categoryName: "Toddlers",
        })
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "list").mockResolvedValue({
          childrenWithDiverseNeedsFundingCategories: [category],
          totalCount: 1,
        })
        vi.spyOn(childrenWithDiverseNeedsFundingCategoriesApi, "get").mockResolvedValue({
          childrenWithDiverseNeedsFundingCategory: category,
          policy: category.policy,
        })
        const authenticationError = new AuthenticationRequiredError()
        const errorHandler = vi.fn()
        vi.spyOn(childrenWithDiverseNeedsFundingRecordsApi, "create").mockRejectedValue(
          authenticationError
        )
        const wrapper = mount(ChildrenWithDiverseNeedsFundingRecordsCreateFormCard, {
          props: {
            centreId: record.centreId,
            fiscalPeriodId: record.fiscalPeriodId,
            fundingPeriodId: 3,
            existingCategoryIds: [],
          },
          global: {
            plugins: [mockVuetify()],
            config: { errorHandler },
          },
        })
        await flushPromises()
        wrapper
          .getComponent(ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete)
          .vm.$emit("update:modelValue", record.categoryId)
        await flushPromises()

        // Act
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Assert
        expect(errorHandler.mock.calls.map(([error]) => error)).toMatchObject([
          {
            name: "AuthenticationRequiredError",
            message: "You must be logged in to access this endpoint",
          },
        ])
      })
    })
  })
})
