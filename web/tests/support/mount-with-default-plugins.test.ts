import { useAuth0 } from "@auth0/auth0-vue"
import { flushPromises } from "@vue/test-utils"

import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import { mockAuth0, mockRouter, mountWithDefaultPlugins } from "@/tests/support"

describe("web/tests/support/mount-with-default-plugins.ts", () => {
  describe("mountWithDefaultPlugins", () => {
    describe("application defaults", () => {
      test("when authentication expires on a custom route, requests login for that destination", async () => {
        // Arrange
        const auth0 = mockAuth0()
        const router = mockRouter([
          { path: "/worksheets", component: { template: "<div />" } },
        ])
        await router.push("/worksheets?month=april")
        await router.isReady()
        const wrapper = mountWithDefaultPlugins(
          {
            template: '<v-btn @click="save">Save</v-btn>',
            setup() {
              function save() {
                throw new AuthenticationRequiredError()
              }
              return { save }
            },
          },
          { router, auth0 }
        )

        // Act
        await wrapper.get("button").trigger("click")
        await flushPromises()

        // Assert
        expect(auth0.loginWithRedirect.mock.calls).toEqual([
          [{ appState: { target: "/worksheets?month=april" } }],
        ])
      })

      test("when one mount navigates, leaves another mount at its own location", async () => {
        // Arrange
        const first = mountWithDefaultPlugins({ template: "<div>{{ $route.fullPath }}</div>" })
        const second = mountWithDefaultPlugins({ template: "<div>{{ $route.fullPath }}</div>" })
        await flushPromises()

        // Act
        await first.vm.$router.push("/?filter=active")
        await flushPromises()

        // Assert
        expect(second.text()).toEqual("/")
      })

      test("when one mount loses authentication, keeps another mount authenticated", async () => {
        // Arrange
        const component = {
          template: "<div>{{ isAuthenticated ? 'Signed in' : 'Signed out' }}</div>",
          setup() {
            const { isAuthenticated } = useAuth0()
            return { isAuthenticated }
          },
        }
        const first = mountWithDefaultPlugins(component)
        const second = mountWithDefaultPlugins(component)

        // Act
        first.vm.$auth0.isAuthenticated.value = false
        await flushPromises()

        // Assert
        expect(second.text()).toEqual("Signed in")
      })
    })
  })
})
