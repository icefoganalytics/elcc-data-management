import { defineComponent, ref } from "vue"
import { flushPromises, mount } from "@vue/test-utils"

import { mockVuetify } from "@/tests/support"
import EditDataTableVirtual from "@/components/common/EditDataTableVirtual.vue"

describe("web/src/components/common/EditDataTableVirtual.vue", () => {
  describe("EditDataTableVirtual", () => {
    describe("keyboard navigation", () => {
      test("when a row save settles, resumes keyboard focus on the next row", async () => {
        // Arrange
        const busy = ref(false)
        const host = document.createElement("div")
        document.body.appendChild(host)
        const harness = defineComponent({
          components: { EditDataTableVirtual },
          setup: () => ({
            busy,
            headers: [{ title: "Occupancy", key: "occupancy" }],
            items: [
              { id: 1, occupancy: "0.0000" },
              { id: 2, occupancy: "0.5000" },
            ],
          }),
          template: `
            <EditDataTableVirtual
              :headers="headers"
              :items="items"
              :editable-columns="['occupancy']"
              :busy="busy"
              :inert="busy"
              @update:cell="busy = true"
            >
              <template #item.occupancy.edit="{ item }">
                <input v-model="item.occupancy" :disabled="busy" />
              </template>
            </EditDataTableVirtual>
          `,
        })
        const wrapper = mount(harness, {
          attachTo: host,
          global: { plugins: [mockVuetify()] },
        })
        try {
          await flushPromises()
          await wrapper.get("tr.cursor-pointer").trigger("click")
          const input = wrapper.get("input")
          await input.setValue("0.2500")

          // Act
          await input.trigger("keydown", { key: "Enter" })
          await flushPromises()
          busy.value = false
          await flushPromises()

          // Assert
          expect(document.activeElement).toBe(wrapper.get("input").element)
        } finally {
          wrapper.unmount()
          host.remove()
        }
      })

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

      test.each([
        ["Enter", 1, "focusBeyondLastInColumn"],
        ["Shift+Enter", 0, "focusBeyondFirstInColumn"],
      ] as const)(
        "when %s reaches a table boundary, emits the column boundary",
        async (key, rowIndex, eventName) => {
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
          await wrapper.findAll("tr.cursor-pointer")[rowIndex]?.trigger("click")
          const input = wrapper.get("input")

          // Act
          await input.trigger("keydown", {
            key: key.includes("Shift") ? "Enter" : key,
            shiftKey: key.includes("Shift"),
          })

          // Assert
          expect(wrapper.emitted(eventName)).toEqual([["occupancy"]])
        }
      )
    })
  })
})
