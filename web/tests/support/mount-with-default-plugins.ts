import { mount } from "@vue/test-utils"

import mockVuetify from "@/tests/support/mock-vuetify"

export const mountWithDefaultPlugins: typeof mount = (component, options) => {
  return mount(component, {
    ...options,
    global: {
      ...options?.global,
      plugins: [mockVuetify(), ...(options?.global?.plugins ?? [])],
    },
  })
}

export default mountWithDefaultPlugins
