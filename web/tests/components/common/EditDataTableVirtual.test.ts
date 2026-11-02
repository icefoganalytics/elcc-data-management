import { flushPromises, mount } from "@vue/test-utils"

import { mockVuetify } from "@/tests/support"
import EditDataTableVirtual from "@/components/common/EditDataTableVirtual.vue"

describe("web/src/components/common/EditDataTableVirtual.vue", () => {
  describe("EditDataTableVirtual", () => {
    describe("keyboard navigation", () => {
      test.each(["Enter", "ArrowDown", "Tab"])(
        "when %s moves to the next row, commits the edited row exactly once",
        async (key) => {
          // Arrange
          const wrapper = mount(EditDataTableVirtual, {
            props: {
              headers: [{ title: "Occupancy", key: "occupancy" }],
              items: [
                { id: 1, occupancy: "0.0000" },
                { id: 2, occupancy: "0.0000" },
              ],
              editableColumns: ["occupancy"],
            },
            global: { plugins: [mockVuetify()] },
          })
          await flushPromises()
          await wrapper.get("tr.cursor-pointer").trigger("click")
          const input = wrapper.get("input")
          await input.setValue("0.2500")

          // Act
          await input.trigger("keydown", { key })
          await flushPromises()

          // Assert
          expect(wrapper.emitted("update:cell")).toEqual([[{ id: 1, occupancy: "0.2500" }]])
        }
      )
    })
  })
})
