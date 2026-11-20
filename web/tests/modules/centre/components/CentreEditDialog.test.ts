import { DOMWrapper, flushPromises } from "@vue/test-utils"

import centresApi, { type CentreAsShow, type CentrePolicy } from "@/api/centres-api"
import { centreFactory } from "@/tests/factories"
import { mockRouter, mountWithDefaultPlugins } from "@/tests/support"

import CentreEditDialog from "@/modules/centre/components/CentreEditDialog.vue"

describe("web/src/modules/centre/components/CentreEditDialog.vue", () => {
  describe("CentreEditDialog", () => {
    describe("direct edit links", () => {
      beforeEach(() => {
        vi.stubGlobal("visualViewport", undefined)
      })

      test("when updates are permitted, saves the edited name", async () => {
        // Arrange
        const centre = centreFactory.build({ id: 91, name: "Original Centre" })
        const policy = { show: true, create: true, update: true, destroy: true }
        vi.spyOn(centresApi, "get").mockResolvedValue({ centre, policy })
        const updatedCentre = { ...centre, name: "Updated Centre" }
        const update = vi.spyOn(centresApi, "update").mockResolvedValue({
          centre: updatedCentre,
          policy,
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/?showCentreEdit=91")
        await router.isReady()
        mountWithDefaultPlugins(CentreEditDialog, { router })
        await flushPromises()
        const body = new DOMWrapper(document.body)

        // Act
        await body.get('input[maxlength="200"]').setValue("Updated Centre")
        await body.get("form").trigger("submit")
        await flushPromises()

        // Assert
        expect(update).toHaveBeenCalledExactlyOnceWith(91, updatedCentre)
      })

      test("when updates are denied, replaces editable fields with an explanation", async () => {
        // Arrange
        const centre = centreFactory.build({ id: 91 })
        vi.spyOn(centresApi, "get").mockResolvedValue({
          centre,
          policy: { show: true, create: false, update: false, destroy: false },
        })
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/?showCentreEdit=91")
        await router.isReady()
        mountWithDefaultPlugins(CentreEditDialog, { router })

        // Act
        await flushPromises()

        // Assert
        expect(new DOMWrapper(document.body).get(".v-card-text").text()).toBe(
          "Centre editing is unavailable. Only System Administrators can edit centre details."
        )
      })

      test("when a denied form is submitted directly, does not send an update", async () => {
        // Arrange
        const centre = centreFactory.build({ id: 91 })
        vi.spyOn(centresApi, "get").mockResolvedValue({
          centre,
          policy: { show: true, create: false, update: false, destroy: false },
        })
        const update = vi.spyOn(centresApi, "update")
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/?showCentreEdit=91")
        await router.isReady()
        mountWithDefaultPlugins(CentreEditDialog, { router })
        await flushPromises()

        // Act
        await new DOMWrapper(document.body).get("form").trigger("submit")
        await flushPromises()

        // Assert
        expect(update).not.toHaveBeenCalled()
      })

      test("when permissions have not loaded, does not offer Save", async () => {
        // Arrange
        const pending = Promise.withResolvers<{ centre: CentreAsShow; policy: CentrePolicy }>()
        vi.spyOn(centresApi, "get").mockReturnValue(pending.promise)
        const router = mockRouter([{ path: "/", component: { template: "<div />" } }])
        await router.push("/?showCentreEdit=91")
        await router.isReady()
        mountWithDefaultPlugins(CentreEditDialog, { router })

        // Act
        await flushPromises()

        // Assert
        expect(new DOMWrapper(document.body).find('button[type="submit"]').exists()).toBe(false)
      })
    })
  })
})
