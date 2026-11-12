import { defineStore } from "pinia"

export type Notification = {
  text: string
  variant: string
  status_code?: number
  icon?: string
}

/**
 * @deprecated - prefer web/src/use/use-snack.ts
 */
export const useNotificationStore = defineStore("notifications", {
  state: (): { message: Notification; showNotification: boolean } => ({
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
    notify(message: Notification) {
      this.message = message
      this.showNotification = true
    },
  },
})
