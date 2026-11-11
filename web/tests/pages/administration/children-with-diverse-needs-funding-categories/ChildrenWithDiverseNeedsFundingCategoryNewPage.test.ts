import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"
import { VTextField } from "vuetify/components"

import httpClient from "@/api/http-client"
import { UserRoles } from "@/api/current-user-api"
import ApiOperationError from "@/api/errors/api-operation-error"
import useCurrentUser from "@/use/use-current-user"
import useSnack from "@/use/use-snack"

import { childrenWithDiverseNeedsFundingCategoryFactory } from "@/tests/factories"
import { mockCurrentUserApi, mockHttpGetRoutes, mockRouter, mockVuetify } from "@/tests/support"
import { DEFAULT_USER } from "@/tests/support/mock-current-user-api"

import CurrencyInput from "@/components/CurrencyInput.vue"
import ChildrenWithDiverseNeedsFundingCategoryNewPage from "@/pages/administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryNewPage.vue"

describe("web/src/pages/administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryNewPage.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingCategoryNewPage", () => {
    describe("creation recovery", () => {
      afterEach(() => {
        useCurrentUser().reset()
      })

      test("when creation fails unexpectedly, delivers the original error to the application boundary", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: 8,
          fundingPeriodId: 3,
        })
        const error = new Error("Connection interrupted")
        const receivedErrors: unknown[] = []
        mockHttpGetRoutes({
          "/api/funding-periods": () => ({
            data: { fundingPeriods: [{ id: 3, fiscalYear: "2026-2027" }], totalCount: 1 },
          }),
          "/api/funding-periods/3": () => ({
            data: { fundingPeriod: { id: 3, fiscalYear: "2026-2027" }, policy: {} },
          }),
        })
        vi.mocked(httpClient.post).mockRejectedValue(error)
        mockCurrentUserApi({
          user: { ...DEFAULT_USER, roles: [UserRoles.SYSTEM_ADMINISTRATOR] },
        })
        await useCurrentUser().fetch()
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoryNewPage },
          {
            path: "/categories",
            name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage",
            component: { template: "<div />" },
          },
        ])
        await router.push("/?fundingPeriodId=3")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoryNewPage, {
          global: {
            plugins: [createPinia(), router, mockVuetify()],
            config: {
              errorHandler(error) {
                receivedErrors.push(error)
              },
            },
          },
        })
        await flushPromises()
        const nameField = wrapper.findAllComponents(VTextField).find((field) => {
          return field.props("label") === "Category Name *"
        })
        if (!nameField) throw new Error("Category name field is missing")

        await nameField.setValue(category.categoryName)
        await wrapper.getComponent(CurrencyInput).setValue(category.monthlyAmount)

        // Act
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Assert
        expect(receivedErrors).toEqual([error])
      })

      test("when creation is rejected, retains the entered name for correction", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: 8,
          fundingPeriodId: 3,
          categoryName: "Needs correction",
        })
        mockHttpGetRoutes({
          "/api/funding-periods": () => ({
            data: { fundingPeriods: [{ id: 3, fiscalYear: "2026-2027" }], totalCount: 1 },
          }),
          "/api/funding-periods/3": () => ({
            data: { fundingPeriod: { id: 3, fiscalYear: "2026-2027" }, policy: {} },
          }),
        })
        vi.mocked(httpClient.post).mockRejectedValue(new ApiOperationError("Name is taken", 422))
        mockCurrentUserApi({
          user: { ...DEFAULT_USER, roles: [UserRoles.SYSTEM_ADMINISTRATOR] },
        })
        await useCurrentUser().fetch()
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoryNewPage },
          {
            path: "/categories",
            name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage",
            component: { template: "<div />" },
          },
        ])
        await router.push("/?fundingPeriodId=3")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoryNewPage, {
          global: {
            plugins: [createPinia(), router, mockVuetify()],
          },
        })
        await flushPromises()
        const nameField = wrapper.findAllComponents(VTextField).find((field) => {
          return field.props("label") === "Category Name *"
        })
        if (!nameField) throw new Error("Category name field is missing")

        await nameField.setValue(category.categoryName)
        await wrapper.getComponent(CurrencyInput).setValue(category.monthlyAmount)

        // Act
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Assert
        expect(nameField.props("modelValue")).toBe("Needs correction")
      })

      test("when creation returns an ordinary operation error, shows local creation feedback", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: 8,
          fundingPeriodId: 3,
        })
        const error = new ApiOperationError("Name is taken", 422)
        mockHttpGetRoutes({
          "/api/funding-periods": () => ({
            data: { fundingPeriods: [{ id: 3, fiscalYear: "2026-2027" }], totalCount: 1 },
          }),
          "/api/funding-periods/3": () => ({
            data: { fundingPeriod: { id: 3, fiscalYear: "2026-2027" }, policy: {} },
          }),
        })
        vi.mocked(httpClient.post).mockRejectedValue(error)
        mockCurrentUserApi({
          user: { ...DEFAULT_USER, roles: [UserRoles.SYSTEM_ADMINISTRATOR] },
        })
        await useCurrentUser().fetch()
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoryNewPage },
          {
            path: "/categories",
            name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage",
            component: { template: "<div />" },
          },
        ])
        await router.push("/?fundingPeriodId=3")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoryNewPage, {
          global: {
            plugins: [createPinia(), router, mockVuetify()],
          },
        })
        await flushPromises()
        const nameField = wrapper.findAllComponents(VTextField).find((field) => {
          return field.props("label") === "Category Name *"
        })
        if (!nameField) throw new Error("Category name field is missing")

        await nameField.setValue(category.categoryName)
        await wrapper.getComponent(CurrencyInput).setValue(category.monthlyAmount)

        // Act
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Assert
        expect(useSnack().message.value).toContain("Name is taken")
      })
    })
  })
})
