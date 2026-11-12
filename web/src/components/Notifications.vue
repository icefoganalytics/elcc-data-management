<template>
  <v-snackbar
    v-model="showNotification"
    location="bottom right"
    :color="prettyMessage(message).color"
  >
    <v-icon
      class="mr-3"
      color="white"
      >{{ prettyMessage(message).icon }}</v-icon
    >
    <span style="color: white">{{ message.text }}</span>
  </v-snackbar>
</template>

<script lang="ts">
import { mapWritableState } from "pinia"

import { useNotificationStore, type Notification } from "@/store/NotificationStore"

/**
 * @deprecated This component is deprecated and will be removed in a future version.
 */
export default {
  name: "NotificationsSnackbar",
  data: () => ({}),
  computed: {
    ...mapWritableState(useNotificationStore, ["showNotification", "message"]),
  },
  methods: {
    prettyMessage(message: Notification) {
      if (message.variant == "success") {
        return {
          color: "green",
          icon: "mdi-check",
          text: message.text,
        }
      } else if (message.variant == "error") {
        return {
          color: "red",
          icon: "mdi-cancel",
          text: message.text,
        }
      } else {
        return {
          color: message.variant,
          icon: "mdi-information",
          text: message.text,
        }
      }
    },
  },
}
</script>
