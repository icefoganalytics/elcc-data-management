import { defineStore } from "pinia"

import { useSnack } from "@/use/use-snack"

/**
 * @deprecated - prefer web/src/use/use-snack.ts
 */
export const useNotificationStore = defineStore("notifications", {
  state: () => ({
    message: {
      status_code: 0,
      text: "Empty Message",
      icon: "mdi-information",
      variant: "primary",
    },
    showNotification: false,
  }),
  actions: {
    async initialize() {},
    notify(message: { text: string; variant: string; [key: string]: unknown }) {
      if (message.variant === "error") {
        useSnack().error(message.text, { cause: message.cause })
        return
      }

      this.message = { ...this.message, ...message }
      this.showNotification = true
    },
  },
})
