import { defineComponent, ref } from "vue"
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils"

import httpClient from "@/api/http-client"
import ChildCareSpaceCategoryPropagationControls from "@/components/child-care-space-categories/ChildCareSpaceCategoryPropagationControls.vue"
import { mockVuetify } from "@/tests/support"

beforeEach(() => {
  // JSDOM omits this optional browser API used by Vuetify's select overlay.
  vi.stubGlobal("visualViewport", undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

type PropagationFormWrapper = VueWrapper

const fiscalPeriods = [
  {
    id: 0,
    fundingPeriodId: 10,
    fiscalYear: "2024/25",
    month: "april",
    dateStart: "2024-04-01",
    dateEnd: "2024-04-30",
    createdAt: "2024-04-01",
    updatedAt: "2024-04-01",
  },
  {
    id: 102,
    fundingPeriodId: 10,
    fiscalYear: "2024/25",
    month: "may",
    dateStart: "2024-05-01",
    dateEnd: "2024-05-31",
    createdAt: "2024-05-01",
    updatedAt: "2024-05-01",
  },
  {
    id: 201,
    fundingPeriodId: 11,
    fiscalYear: "2024/25",
    month: "april",
    dateStart: "2024-04-01",
    dateEnd: "2024-04-30",
    createdAt: "2024-04-01",
    updatedAt: "2024-04-01",
  },
]

const PropagationControlsForm = defineComponent({
  components: {
    ChildCareSpaceCategoryPropagationControls,
  },
  setup() {
    const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
    const fundingPeriodId = ref<number | null>(10)
    const applyToFutureMonths = ref(false)
    const propagationStartFiscalPeriodId = ref<number | null>(null)
    const saveStatus = ref("Not saved")

    async function save() {
      if (form.value === null) {
        return
      }

      const { valid } = await form.value.validate()
      if (valid) {
        saveStatus.value = "Saved"
      }
    }

    function switchFundingPeriod() {
      fundingPeriodId.value = 11
    }

    return {
      form,
      fundingPeriodId,
      applyToFutureMonths,
      propagationStartFiscalPeriodId,
      saveStatus,
      save,
      switchFundingPeriod,
    }
  },
  template: `
    <v-form ref="form" @submit.prevent="save">
      <ChildCareSpaceCategoryPropagationControls
        v-model:apply-to-future-months="applyToFutureMonths"
        v-model:propagation-start-fiscal-period-id="propagationStartFiscalPeriodId"
        :funding-period-id="fundingPeriodId"
      />
      <v-btn type="submit">Save</v-btn>
      <v-btn type="button" @click="switchFundingPeriod">Switch Funding Period</v-btn>
      <output data-testid="save-status">{{ saveStatus }}</output>
    </v-form>
  `,
})

function mockFiscalPeriodList() {
  vi.mocked(httpClient, true).get.mockImplementation(async (url) => {
    if (url === "/api/fiscal-periods") {
      return {
        data: {
          fiscalPeriods,
          totalCount: fiscalPeriods.length,
        },
      }
    }

    throw new Error(`Unexpected GET ${url}`)
  })
}

async function mountPropagationForm(): Promise<PropagationFormWrapper> {
  const wrapper = mount(PropagationControlsForm, {
    attachTo: document.body,
    global: { plugins: [mockVuetify()] },
  })
  await flushPromises()
  return wrapper
}

async function enablePropagation(wrapper: PropagationFormWrapper) {
  await wrapper.get('input[type="checkbox"]').setValue(true)
  await flushPromises()
}

async function chooseMonth(wrapper: PropagationFormWrapper, title: string) {
  await wrapper.get(".v-select .v-field").trigger("mousedown")
  await flushPromises()

  const monthOption = Array.from(document.querySelectorAll(".v-list-item")).find((option) =>
    option.textContent?.includes(title)
  )
  if (monthOption === undefined) {
    throw new Error(`Could not find fiscal month option: ${title}`)
  }

  monthOption.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  await flushPromises()
}

async function submitForm(wrapper: PropagationFormWrapper) {
  await wrapper.get('button[type="submit"]').trigger("click")
  await flushPromises()
}

describe("web/src/components/child-care-space-categories/ChildCareSpaceCategoryPropagationControls.vue", () => {
  describe("ChildCareSpaceCategoryPropagationControls", () => {
    describe("when propagation is unchecked", () => {
      test("when propagation is unchecked, allows saving without a month", async () => {
        // Arrange
        const wrapper = await mountPropagationForm()

        // Act
        await submitForm(wrapper)

        // Assert
        expect(wrapper.get("[data-testid='save-status']").text()).toBe("Saved")
      })
    })

    describe("when propagation is checked", () => {
      test("when propagation is checked without a month, rejects saving", async () => {
        // Arrange
        mockFiscalPeriodList()
        const wrapper = await mountPropagationForm()
        await enablePropagation(wrapper)

        // Act
        await submitForm(wrapper)

        // Assert
        expect(wrapper.get("[data-testid='save-status']").text()).toBe("Not saved")
      })

      test("when the selected month has ID zero, allows saving", async () => {
        // Arrange
        mockFiscalPeriodList()
        const wrapper = await mountPropagationForm()
        await enablePropagation(wrapper)

        // Act
        await chooseMonth(wrapper, "April — 2024/25")
        await submitForm(wrapper)

        // Assert
        expect(wrapper.get("[data-testid='save-status']").text()).toBe("Saved")
      })

      test("when the funding period changes, requires a new month", async () => {
        // Arrange
        mockFiscalPeriodList()
        const wrapper = await mountPropagationForm()
        await enablePropagation(wrapper)
        await chooseMonth(wrapper, "April — 2024/25")

        // Act
        await wrapper.get('button[type="button"]').trigger("click")
        await flushPromises()
        await submitForm(wrapper)

        // Assert
        expect(wrapper.get("[data-testid='save-status']").text()).toBe("Not saved")
      })

      test("when months fail to load, prevents saving", async () => {
        // Arrange
        vi.mocked(httpClient, true).get.mockRejectedValue(new Error("Network error"))
        const wrapper = await mountPropagationForm()
        await enablePropagation(wrapper)

        // Act
        await submitForm(wrapper)

        // Assert
        expect(wrapper.get("[data-testid='save-status']").text()).toBe("Not saved")
      })
    })
  })
})
