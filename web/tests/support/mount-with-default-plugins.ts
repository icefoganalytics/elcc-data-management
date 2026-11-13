import { mount } from "@vue/test-utils"
import { isArray, mergeWith } from "lodash"

import mockVuetify from "@/tests/support/mock-vuetify"

export const mountWithDefaultPlugins: typeof mount = (component, options) => {
  return mount(component, {
    ...options,
    global: mergeWith(
      {},
      { plugins: [mockVuetify()] },
      options?.global,
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
