<template>
  <v-snackbar
    v-model="showSnackbar"
    v-bind="{
      multiLine: true,
      timeout: apiResponseError ? -1 : defaultTimeout,
      ...options,
    }"
  >
    <template v-if="apiResponseError">
      <div class="text-white">
        <p v-if="apiResponseError.isChallenge">
          The browser verification challenge interrupted the request. Verify in a normal browser
          session, then reload the app; this does not guarantee the challenge will be cleared.
        </p>
        <p v-else>The server response was unavailable. Your request outcome is unknown.</p>
        <p>
          A write may have reached the server even though its result is unknown. Check the current
          server state before manually retrying.
        </p>
        <p>
          Reloading discards unsaved changes in open forms. Reloading does not guarantee that an
          interrupted write was not applied.
        </p>
        <p>
          <span>Request: {{ apiResponseError.method }} {{ apiResponseError.path }}</span>
          <span> (status {{ apiResponseError.status }})</span>
          <span v-if="apiResponseError.rayId"> (Ray ID {{ apiResponseError.rayId }})</span>
        </p>
      </div>
    </template>
    <span
      v-else
      :class="`text-${constrastingColor}`"
    >
      {{ message }}
    </span>
    <template #actions>
      <template v-if="apiResponseError">
        <v-btn
          color="white"
          variant="text"
          @click="close"
        >
          Keep Editing
        </v-btn>
        <v-btn
          color="white"
          variant="text"
          @click="reloadApp"
        >
          Reload App
        </v-btn>
      </template>
      <v-btn
        v-else
        :color="constrastingColor"
        variant="text"
        @click="close"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"

import { useSnack } from "@/use/use-snack"
import { isEmpty } from "lodash"

const { message, options, apiResponseError, reset } = useSnack()
const showSnackbar = ref(false)
const defaultTimeout = 4000

const constrastingColor = computed(() => getContrastingColor(options.value.color))

watch(
  () => [message.value, options.value],
  () => {
    if (isEmpty(message.value)) {
      showSnackbar.value = false
      return
    }

    show()
  },
  { deep: true, immediate: true }
)

watch(
  () => showSnackbar.value,
  (newShowSnackbar) => {
    if (newShowSnackbar === false) {
      reset()
    }
  }
)

function close() {
  showSnackbar.value = false
}

function reloadApp() {
  const isReloadConfirmed = window.confirm(
    "Reloading discards unsaved changes in open forms. It does not guarantee that any interrupted write was not applied."
  )

  if (isReloadConfirmed) {
    window.location.reload()
  }
}

function show() {
  showSnackbar.value = true
}

function getContrastingColor(color: string | undefined) {
  if (color === undefined) return "white"

  const colorMap: {
    [key: string]: "white" | "black" | undefined
  } = {
    primary: "white",
    secondary: "black",
    accent: "black",
    error: "white",
    info: "white",
    success: "white",
    warning: "black",
  }

  return colorMap[color] || "white"
}
</script>
