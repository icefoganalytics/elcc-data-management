import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"
import { VTextField } from "vuetify/components"

import httpClient from "@/api/http-client"
import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import useSnack from "@/use/use-snack"

import { childrenWithDiverseNeedsFundingCategoryFactory } from "@/tests/factories"
import { mockHttpGetRoutes, mockRouter, mockVuetify } from "@/tests/support"

import ChildrenWithDiverseNeedsFundingCategoryEditPage from "@/pages/administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryEditPage.vue"

describe("web/src/pages/administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryEditPage.vue", () => {
  describe("ChildrenWithDiverseNeedsFundingCategoryEditPage", () => {
    describe("save recovery", () => {
      test("when a save is rejected, retains the edited category name for correction", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({ id: 8 })
        mockHttpGetRoutes({
          "/api/children-with-diverse-needs-funding-categories/8": () => ({
            data: { childrenWithDiverseNeedsFundingCategory: category, policy: category.policy },
          }),
          "/api/funding-periods": () => ({ data: { fundingPeriods: [], totalCount: 0 } }),
        })
        vi.mocked(httpClient.patch).mockRejectedValue(new ApiOperationError("Name is taken", 422))
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoryEditPage },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoryEditPage, {
          props: { childrenWithDiverseNeedsFundingCategoryId: "8" },
          global: {
            plugins: [createPinia(), router, mockVuetify()],
          },
        })
        await flushPromises()
        const nameField = wrapper.findAllComponents(VTextField).find((field) => {
          return field.props("label") === "Category Name *"
        })
        if (!nameField) throw new Error("Category name field is missing")

        await nameField.setValue("Needs correction")

        // Act
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Assert
        const retainedNameField = wrapper.findAllComponents(VTextField).find((field) => {
          return field.props("label") === "Category Name *"
        })
        expect(retainedNameField?.props("modelValue")).toBe("Needs correction")
      })

      test("when a rejected save is corrected and retried, saves the corrected fields and exact money", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({
          id: 8,
          fromAge: 0,
          toAge: 5,
          monthlyAmount: "54.9600",
        })
        mockHttpGetRoutes({
          "/api/children-with-diverse-needs-funding-categories/8": () => ({
            data: { childrenWithDiverseNeedsFundingCategory: category, policy: category.policy },
          }),
          "/api/funding-periods": () => ({ data: { fundingPeriods: [], totalCount: 0 } }),
        })
        vi.mocked(httpClient.patch)
          .mockRejectedValueOnce(new ApiOperationError("Name is taken", 422))
          .mockResolvedValueOnce({
            data: {
              childrenWithDiverseNeedsFundingCategory: { ...category, categoryName: "Corrected" },
              policy: category.policy,
            },
          })
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoryEditPage },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoryEditPage, {
          props: { childrenWithDiverseNeedsFundingCategoryId: "8" },
          global: {
            plugins: [createPinia(), router, mockVuetify()],
          },
        })
        await flushPromises()
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Act
        const nameField = wrapper.findAllComponents(VTextField).find((field) => {
          return field.props("label") === "Category Name *"
        })
        if (!nameField) throw new Error("Category name field is missing")

        await nameField.setValue("Corrected")
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Assert
        expect(httpClient.patch).toHaveBeenNthCalledWith(
          2,
          "/api/children-with-diverse-needs-funding-categories/8",
          { categoryName: "Corrected", fromAge: 0, toAge: 5, monthlyAmount: "54.9600" }
        )
      })

      test("when a save is pending, keeps the edited field mounted and disabled", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({ id: 8 })
        mockHttpGetRoutes({
          "/api/children-with-diverse-needs-funding-categories/8": () => ({
            data: { childrenWithDiverseNeedsFundingCategory: category, policy: category.policy },
          }),
          "/api/funding-periods": () => ({ data: { fundingPeriods: [], totalCount: 0 } }),
        })
        vi.mocked(httpClient.patch).mockReturnValue(new Promise(() => {}))
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoryEditPage },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoryEditPage, {
          props: { childrenWithDiverseNeedsFundingCategoryId: "8" },
          global: {
            plugins: [createPinia(), router, mockVuetify()],
          },
        })
        await flushPromises()

        // Act
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Assert
        const nameField = wrapper.findAllComponents(VTextField).find((field) => {
          return field.props("label") === "Category Name *"
        })
        expect(nameField?.props("disabled")).toBe(true)
      })

      test("when saving requires authentication, delivers the original error to the application boundary", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({ id: 8 })
        const error = new AuthenticationRequiredError()
        const receivedErrors: unknown[] = []
        mockHttpGetRoutes({
          "/api/children-with-diverse-needs-funding-categories/8": () => ({
            data: { childrenWithDiverseNeedsFundingCategory: category, policy: category.policy },
          }),
          "/api/funding-periods": () => ({ data: { fundingPeriods: [], totalCount: 0 } }),
        })
        vi.mocked(httpClient.patch).mockRejectedValue(error)
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoryEditPage },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoryEditPage, {
          props: { childrenWithDiverseNeedsFundingCategoryId: "8" },
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

        // Act
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Assert
        expect(receivedErrors).toEqual([error])
      })

      test("when saving returns an ordinary operation error, shows local update feedback", async () => {
        // Arrange
        const category = childrenWithDiverseNeedsFundingCategoryFactory.build({ id: 8 })
        const error = new ApiOperationError("Name is taken", 422)
        mockHttpGetRoutes({
          "/api/children-with-diverse-needs-funding-categories/8": () => ({
            data: { childrenWithDiverseNeedsFundingCategory: category, policy: category.policy },
          }),
          "/api/funding-periods": () => ({ data: { fundingPeriods: [], totalCount: 0 } }),
        })
        vi.mocked(httpClient.patch).mockRejectedValue(error)
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoryEditPage },
        ])
        await router.push("/")
        await router.isReady()
        const wrapper = mount(ChildrenWithDiverseNeedsFundingCategoryEditPage, {
          props: { childrenWithDiverseNeedsFundingCategoryId: "8" },
          global: {
            plugins: [createPinia(), router, mockVuetify()],
          },
        })
        await flushPromises()

        // Act
        await wrapper.get("form").trigger("submit")
        await flushPromises()

        // Assert
        expect(useSnack().message.value).toContain("Name is taken")
      })
    })

    describe("load recovery", () => {
      test("when the initial category load fails, shows snackbar feedback", async () => {
        // Arrange
        mockHttpGetRoutes({
          "/api/children-with-diverse-needs-funding-categories/8": () => {
            throw new ApiOperationError("Unavailable", 503)
          },
          "/api/funding-periods": () => ({ data: { fundingPeriods: [], totalCount: 0 } }),
        })

        // Act
        const router = mockRouter([
          { path: "/", component: ChildrenWithDiverseNeedsFundingCategoryEditPage },
        ])
        await router.push("/")
        await router.isReady()
        mount(ChildrenWithDiverseNeedsFundingCategoryEditPage, {
          props: { childrenWithDiverseNeedsFundingCategoryId: "8" },
          global: {
            plugins: [createPinia(), router, mockVuetify()],
          },
        })
        await flushPromises()

        // Assert
        expect(useSnack().message.value).toContain("Unavailable")
      })
    })
  })
})
