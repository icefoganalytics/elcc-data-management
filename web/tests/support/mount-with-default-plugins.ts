import { mount } from "@vue/test-utils"
import { mergeWith } from "lodash"

import mockVuetify from "@/tests/support/mock-vuetify"

export const mountWithDefaultPlugins: typeof mount = (component, options) => {
  return mount(component, {
    ...options,
    global: mergeWith(
      {},
      { plugins: [mockVuetify()] },
      options?.global,
      (value: unknown, source: unknown, key: string) => {
        if (key !== "plugins") return
        if (Array.isArray(value) && Array.isArray(source)) return value.concat(source)
        return source
      }
    ),
  })
}

export default mountWithDefaultPlugins
