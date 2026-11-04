import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"
import childrenWithDiverseNeedsFundingRecordsApi from "@/api/children-with-diverse-needs-funding-records-api"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"

import { childrenWithDiverseNeedsFundingRecordFactory } from "@/tests/factories"
import { mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategorySearchableAutocomplete.vue"
import ChildrenWithDiverseNeedsFundingRecordsCreateFormCard from "@/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsCreateFormCard.vue"

describe("web/src/components/children-with-diverse-needs-funding-records/ChildrenWithDiverseNeedsFundingRecordsCreateFormCard.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingRecordsCreateFormCard", () => {
    describe("#create", () => {
      test("when valid occupancies are submitted, preserves decimal strings in the creation payload", async () => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build()
        const category = {
          id: record.categoryId,
          fundingPeriodId: 3,
          categoryName: "Toddlers",
          fromAge: null,
          toAge: null,
          monthlyAmount: "54.9600",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          policy: { show: true, create: true, update: true, destroy: false },
        }
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
          global: { plugins: [createPinia(), mockVuetify()] },
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
          centreId: record.centreId,
          fiscalPeriodId: record.fiscalPeriodId,
          categoryId: record.categoryId,
          estimatedChildOccupancyRate: "0.2500",
          actualChildOccupancyRate: "0.1250",
          applyToCurrentAndFutureFiscalPeriods: false,
        })
      })

      test("when creation requires authentication, forwards the original error to Vue", async () => {
        // Arrange
        const record = childrenWithDiverseNeedsFundingRecordFactory.build()
        const category = {
          id: record.categoryId,
          fundingPeriodId: 3,
          categoryName: "Toddlers",
          fromAge: null,
          toAge: null,
          monthlyAmount: "54.9600",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          policy: { show: true, create: true, update: true, destroy: false },
        }
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
            plugins: [createPinia(), mockVuetify()],
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
        expect(errorHandler).toHaveBeenCalledWith(
          authenticationError,
          expect.anything(),
          expect.any(String)
        )
      })
    })
  })
})
