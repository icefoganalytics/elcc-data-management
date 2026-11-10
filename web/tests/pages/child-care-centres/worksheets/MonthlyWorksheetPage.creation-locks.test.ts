import { createPinia } from "pinia"
import { flushPromises, mount } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import { FiscalPeriodMonths } from "@/use/use-fiscal-periods"

import { fiscalPeriodFactory, fundingSubmissionLineJsonFactory } from "@/tests/factories"
import { mockRouter, mockVuetify } from "@/tests/support"

import MonthlyWorksheetPage from "@/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue"

describe("web/src/pages/child-care-centres/worksheets/MonthlyWorksheetPage.vue", () => {
  describe("MonthlyWorksheetPage", () => {
    describe("creation locks", () => {
      test.each([
        ["AdministrationCostCreateFormCard", "Add Administration Cost"],
        ["QualityEnhancementCreateFormCard", "Add Quality Enhancement"],
        ["ChildrenWithDiverseNeedsFundingRecordsCreateFormCard", "Add Diverse Need"],
      ])(
        "when a %s unmounts during month navigation, releases its creation lock",
        async (formName, addLabel) => {
          // Arrange
          const aprilWorksheet = fundingSubmissionLineJsonFactory.build({
            id: 44,
            centreId: 1,
            fiscalYear: "2024/25",
            dateName: "April",
            lines: [],
          })
          const mayWorksheet = fundingSubmissionLineJsonFactory.build({
            id: 45,
            centreId: 1,
            fiscalYear: "2024/25",
            dateName: "May",
            lines: [],
          })
          const april = fiscalPeriodFactory.build({
            id: 4,
            fundingPeriodId: 1,
            fiscalYear: "2024-25",
            month: FiscalPeriodMonths.APRIL,
          })
          const may = fiscalPeriodFactory.build({
            id: 5,
            fundingPeriodId: 1,
            fiscalYear: "2024-25",
            month: FiscalPeriodMonths.MAY,
          })
          vi.mocked(httpClient, true).get.mockImplementation(async (url, config) => {
            if (url === "/api/funding-submission-line-jsons") {
              const worksheet =
                config?.params?.where?.dateName === "April" ? aprilWorksheet : mayWorksheet
              return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
            }
            if (url === "/api/fiscal-periods") {
              const period = config?.params?.where?.month === FiscalPeriodMonths.APRIL ? april : may
              return { data: { fiscalPeriods: [period], totalCount: 1 } }
            }
            if (url === "/api/administration-costs") {
              return { data: { administrationCosts: [], totalCount: 0 } }
            }
            if (url === "/api/children-with-diverse-needs-funding-records") {
              return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
            }
            if (url === "/api/quality-enhancements") {
              return { data: { qualityEnhancements: [], totalCount: 0 } }
            }
            if (url === "/api/child-care-spaces") {
              return { data: { childCareSpaces: [], totalCount: 0 } }
            }
            if (url === "/api/administration-cost-categories") {
              return { data: { administrationCostCategories: [], totalCount: 0 } }
            }
            if (url === "/api/quality-enhancement-categories") {
              return { data: { qualityEnhancementCategories: [], totalCount: 0 } }
            }
            if (url === "/api/children-with-diverse-needs-funding-categories") {
              return { data: { childrenWithDiverseNeedsFundingCategories: [], totalCount: 0 } }
            }
            return { data: { fundingSubmissionLineJson: mayWorksheet } }
          })
          const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
          await router.push("/")
          await router.isReady()
          const wrapper = mount(MonthlyWorksheetPage, {
            props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
            global: {
              plugins: [router, createPinia(), mockVuetify()],
              stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
            },
          })
          await flushPromises()
          const firstAdd = wrapper.findAll("button").find((button) => button.text() === addLabel)
          if (!firstAdd) throw new Error(`Expected ${addLabel}`)
          await firstAdd.trigger("click")
          const previousForm = wrapper.getComponent({ name: formName })
          previousForm.vm.$emit("saving", true)
          await flushPromises()

          // Act
          await wrapper.setProps({ month: FiscalPeriodMonths.MAY })
          await flushPromises()

          // Assert
          const save = wrapper.findAll("button").find((button) => button.text() === "Save")
          if (!save) throw new Error("Expected worksheet Save")
          expect(save.attributes("disabled")).toEqual(undefined)
        }
      )

      test.each([
        ["AdministrationCostCreateFormCard", "Add Administration Cost"],
        ["QualityEnhancementCreateFormCard", "Add Quality Enhancement"],
        ["ChildrenWithDiverseNeedsFundingRecordsCreateFormCard", "Add Diverse Need"],
      ])(
        "when an old %s reports completion after month navigation, keeps the newer creation locked",
        async (formName, addLabel) => {
          // Arrange
          const aprilWorksheet = fundingSubmissionLineJsonFactory.build({
            id: 44,
            centreId: 1,
            fiscalYear: "2024/25",
            dateName: "April",
            lines: [],
          })
          const mayWorksheet = fundingSubmissionLineJsonFactory.build({
            id: 45,
            centreId: 1,
            fiscalYear: "2024/25",
            dateName: "May",
            lines: [],
          })
          const april = fiscalPeriodFactory.build({
            id: 4,
            fundingPeriodId: 1,
            fiscalYear: "2024-25",
            month: FiscalPeriodMonths.APRIL,
          })
          const may = fiscalPeriodFactory.build({
            id: 5,
            fundingPeriodId: 1,
            fiscalYear: "2024-25",
            month: FiscalPeriodMonths.MAY,
          })
          vi.mocked(httpClient, true).get.mockImplementation(async (url, config) => {
            if (url === "/api/funding-submission-line-jsons") {
              const worksheet =
                config?.params?.where?.dateName === "April" ? aprilWorksheet : mayWorksheet
              return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
            }
            if (url === "/api/fiscal-periods") {
              const period = config?.params?.where?.month === FiscalPeriodMonths.APRIL ? april : may
              return { data: { fiscalPeriods: [period], totalCount: 1 } }
            }
            if (url === "/api/administration-costs") {
              return { data: { administrationCosts: [], totalCount: 0 } }
            }
            if (url === "/api/children-with-diverse-needs-funding-records") {
              return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
            }
            if (url === "/api/quality-enhancements") {
              return { data: { qualityEnhancements: [], totalCount: 0 } }
            }
            if (url === "/api/child-care-spaces") {
              return { data: { childCareSpaces: [], totalCount: 0 } }
            }
            if (url === "/api/administration-cost-categories") {
              return { data: { administrationCostCategories: [], totalCount: 0 } }
            }
            if (url === "/api/quality-enhancement-categories") {
              return { data: { qualityEnhancementCategories: [], totalCount: 0 } }
            }
            if (url === "/api/children-with-diverse-needs-funding-categories") {
              return { data: { childrenWithDiverseNeedsFundingCategories: [], totalCount: 0 } }
            }
            return { data: { fundingSubmissionLineJson: mayWorksheet } }
          })
          const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
          await router.push("/")
          await router.isReady()
          const wrapper = mount(MonthlyWorksheetPage, {
            props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
            global: {
              plugins: [router, createPinia(), mockVuetify()],
              stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
            },
          })
          await flushPromises()
          const firstAdd = wrapper.findAll("button").find((button) => button.text() === addLabel)
          if (!firstAdd) throw new Error(`Expected ${addLabel}`)
          await firstAdd.trigger("click")
          const previousForm = wrapper.getComponent({ name: formName })
          previousForm.vm.$emit("saving", true)
          await flushPromises()

          // Act
          await wrapper.setProps({ month: FiscalPeriodMonths.MAY })
          await flushPromises()
          const nextAdd = wrapper.findAll("button").find((button) => button.text() === addLabel)
          if (!nextAdd) throw new Error(`Expected ${addLabel}`)
          await nextAdd.trigger("click")
          const currentForm = wrapper.getComponent({ name: formName })
          currentForm.vm.$emit("saving", true)
          previousForm.vm.$emit("saving", false)
          await flushPromises()

          // Assert
          const save = wrapper.findAll("button").find((button) => button.text() === "Save")
          if (!save) throw new Error("Expected worksheet Save")
          expect(save.attributes("disabled")).toEqual("")
        }
      )

      test.each([
        ["AdministrationCostCreateFormCard", "Add Administration Cost"],
        ["QualityEnhancementCreateFormCard", "Add Quality Enhancement"],
        ["ChildrenWithDiverseNeedsFundingRecordsCreateFormCard", "Add Diverse Need"],
      ])(
        "when the current %s finishes after month navigation, releases its creation lock",
        async (formName, addLabel) => {
          // Arrange
          const aprilWorksheet = fundingSubmissionLineJsonFactory.build({
            id: 44,
            centreId: 1,
            fiscalYear: "2024/25",
            dateName: "April",
            lines: [],
          })
          const mayWorksheet = fundingSubmissionLineJsonFactory.build({
            id: 45,
            centreId: 1,
            fiscalYear: "2024/25",
            dateName: "May",
            lines: [],
          })
          const april = fiscalPeriodFactory.build({
            id: 4,
            fundingPeriodId: 1,
            fiscalYear: "2024-25",
            month: FiscalPeriodMonths.APRIL,
          })
          const may = fiscalPeriodFactory.build({
            id: 5,
            fundingPeriodId: 1,
            fiscalYear: "2024-25",
            month: FiscalPeriodMonths.MAY,
          })
          vi.mocked(httpClient, true).get.mockImplementation(async (url, config) => {
            if (url === "/api/funding-submission-line-jsons") {
              const worksheet =
                config?.params?.where?.dateName === "April" ? aprilWorksheet : mayWorksheet
              return { data: { fundingSubmissionLineJsons: [worksheet], totalCount: 1 } }
            }
            if (url === "/api/fiscal-periods") {
              const period = config?.params?.where?.month === FiscalPeriodMonths.APRIL ? april : may
              return { data: { fiscalPeriods: [period], totalCount: 1 } }
            }
            if (url === "/api/administration-costs") {
              return { data: { administrationCosts: [], totalCount: 0 } }
            }
            if (url === "/api/children-with-diverse-needs-funding-records") {
              return { data: { childrenWithDiverseNeedsFundingRecords: [], totalCount: 0 } }
            }
            if (url === "/api/quality-enhancements") {
              return { data: { qualityEnhancements: [], totalCount: 0 } }
            }
            if (url === "/api/child-care-spaces") {
              return { data: { childCareSpaces: [], totalCount: 0 } }
            }
            if (url === "/api/administration-cost-categories") {
              return { data: { administrationCostCategories: [], totalCount: 0 } }
            }
            if (url === "/api/quality-enhancement-categories") {
              return { data: { qualityEnhancementCategories: [], totalCount: 0 } }
            }
            if (url === "/api/children-with-diverse-needs-funding-categories") {
              return { data: { childrenWithDiverseNeedsFundingCategories: [], totalCount: 0 } }
            }
            return { data: { fundingSubmissionLineJson: mayWorksheet } }
          })
          const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
          await router.push("/")
          await router.isReady()
          const wrapper = mount(MonthlyWorksheetPage, {
            props: { centreId: 1, fiscalYearSlug: "2024-25", month: FiscalPeriodMonths.APRIL },
            global: {
              plugins: [router, createPinia(), mockVuetify()],
              stubs: { BuildingExpenseCreateFormCard: true, BuildingExpensesEditTable: true },
            },
          })
          await flushPromises()
          const firstAdd = wrapper.findAll("button").find((button) => button.text() === addLabel)
          if (!firstAdd) throw new Error(`Expected ${addLabel}`)
          await firstAdd.trigger("click")
          const previousForm = wrapper.getComponent({ name: formName })
          previousForm.vm.$emit("saving", true)
          await flushPromises()

          // Act
          await wrapper.setProps({ month: FiscalPeriodMonths.MAY })
          await flushPromises()
          const nextAdd = wrapper.findAll("button").find((button) => button.text() === addLabel)
          if (!nextAdd) throw new Error(`Expected ${addLabel}`)
          await nextAdd.trigger("click")
          const currentForm = wrapper.getComponent({ name: formName })
          currentForm.vm.$emit("saving", true)
          previousForm.vm.$emit("saving", false)
          await flushPromises()
          currentForm.vm.$emit("saving", false)
          await flushPromises()

          // Assert
          const save = wrapper.findAll("button").find((button) => button.text() === "Save")
          if (!save) throw new Error("Expected worksheet Save")
          expect(save.attributes("disabled")).toEqual(undefined)
        }
      )
    })
  })
})
