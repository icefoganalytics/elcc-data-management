import { flushPromises } from "@vue/test-utils"

import centresApi from "@/api/centres-api"
import { centreFactory } from "@/tests/factories"
import { mountWithDefaultPlugins } from "@/tests/support"

import CentreDetailsCard from "@/modules/centre/components/CentreDetailsCard.vue"

describe("web/src/modules/centre/components/CentreDetailsCard.vue", () => {
  describe("CentreDetailsCard", () => {
    describe("edit permission", () => {
      test("when updates are permitted, offers the edit action", async () => {
        // Arrange
        const centre = centreFactory.build()
        vi.spyOn(centresApi, "get").mockResolvedValue({
          centre,
          policy: { show: true, create: true, update: true, destroy: true },
        })
        const wrapper = mountWithDefaultPlugins(CentreDetailsCard, {
          props: { centreId: centre.id },
        })

        // Act
        await flushPromises()

        // Assert
        expect(wrapper.get('button[title="Edit"]').isVisible()).toBe(true)
      })

      test("when updates are denied, hides the edit action", async () => {
        // Arrange
        const centre = centreFactory.build()
        vi.spyOn(centresApi, "get").mockResolvedValue({
          centre,
          policy: { show: true, create: false, update: false, destroy: false },
        })
        const wrapper = mountWithDefaultPlugins(CentreDetailsCard, {
          props: { centreId: centre.id },
        })

        // Act
        await flushPromises()

        // Assert
        expect(wrapper.find('button[title="Edit"]').exists()).toBe(false)
      })

      test("when updates are denied, keeps licence details readable", async () => {
        // Arrange
        const centre = centreFactory.build({ license: "LIC-91" })
        vi.spyOn(centresApi, "get").mockResolvedValue({
          centre,
          policy: { show: true, create: false, update: false, destroy: false },
        })
        const wrapper = mountWithDefaultPlugins(CentreDetailsCard, {
          props: { centreId: centre.id },
        })

        // Act
        await flushPromises()

        // Assert
        expect(wrapper.text()).toContain("LIC-91")
      })
    })
  })
})
