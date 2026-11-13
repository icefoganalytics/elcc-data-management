import { mount } from "@vue/test-utils"
import { type Plugin } from "vue"
import { type Router } from "vue-router"
import { isArray, mergeWith } from "lodash"

import apiResponseErrorPlugin from "@/plugins/api-response-error-plugin"

import mockAuth0 from "@/tests/support/mock-auth0"
import mockRouter from "@/tests/support/mock-router"
import mockVuetify from "@/tests/support/mock-vuetify"

type DefaultPluginOptions = {
  router?: Router
  auth0?: ReturnType<typeof mockAuth0>
  apiResponseErrorHandling?: boolean
}

type MountWithDefaultPlugins = <T>(
  component: T,
  options?: Parameters<typeof mount<T>>[1] & DefaultPluginOptions
) => ReturnType<typeof mount<T>>

export const mountWithDefaultPlugins: MountWithDefaultPlugins = (component, options = {}) => {
  const {
    router = mockRouter([
      { path: "/", component: { template: "<div />" } },
      {
        path: "/errors/internal-server-error",
        name: "errors/InternalServerErrorPage",
        component: { template: "<div />" },
      },
    ]),
    auth0 = mockAuth0(),
    apiResponseErrorHandling = true,
    ...mountOptions
  } = options
  const plugins: Plugin[] = [router, mockVuetify(), auth0]
  if (apiResponseErrorHandling) {
    plugins.push(apiResponseErrorPlugin)
  }

  return mount(component, {
    ...mountOptions,
    global: mergeWith(
      {},
      { plugins },
      mountOptions.global,
      (defaultValue: unknown, suppliedValue: unknown, key: string) => {
        if (key !== "plugins") return

        if (isArray(defaultValue) && isArray(suppliedValue)) {
          return defaultValue.concat(suppliedValue)
        }

        return suppliedValue
      }
    ),
  })
}

export default mountWithDefaultPlugins
