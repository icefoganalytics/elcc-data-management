<template>
  <v-dialog
    v-model="showDialog"
    :style="{ zIndex: RESPONSE_DIALOG_Z_INDEX }"
    persistent
    scrollable
    max-width="720"
    aria-labelledby="api-response-error-title"
  >
    <v-card>
      <v-card-title
        id="api-response-error-title"
        class="text-wrap"
      >
        Browser verification required
      </v-card-title>
      <v-card-text>
        <p>
          Cloudflare interrupted a request to ELCC. Reload this page to try browser verification
          again. You may be asked to verify you are human.
        </p>
        <p class="mt-4">
          The request was not completed normally. Check the current state before trying again. ELCC
          will not automatically repeat your action.
        </p>
        <p class="mt-4">Reloading may discard unsaved changes.</p>
        <dl class="mt-4">
          <dt class="font-weight-bold">Request</dt>
          <dd class="text-break">{{ error.method }} {{ error.path }}</dd>
          <dt class="font-weight-bold mt-2">HTTP status</dt>
          <dd>{{ error.status }}</dd>
          <template v-if="error.rayId">
            <dt class="font-weight-bold mt-2">Cloudflare Ray ID</dt>
            <dd class="text-break">{{ error.rayId }}</dd>
          </template>
        </dl>
        <CloudflareResponsePreview
          v-if="error.isPresent && error.cloudflareHtml"
          :html="error.cloudflareHtml"
        />
      </v-card-text>
      <v-card-actions class="flex-wrap">
        <v-spacer />
        <v-btn
          color="primary"
          :loading="isReloading"
          @click="closeAndReload"
        >
          Reload and verify
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { useRouteQuery } from "@vueuse/router"
import { START_LOCATION, useRouter } from "vue-router"

import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"

import useCloudflareChallenge from "@/use/use-cloudflare-challenge"
import booleanTransformer from "@/utils/use-route-query-transformers/boolean-transformer"

import CloudflareResponsePreview from "@/components/CloudflareResponsePreview.vue"

// Keep recovery above Vuetify's dialog/snackbar stack, including nested forms.
const RESPONSE_DIALOG_Z_INDEX = 20000

const router = useRouter()

const { error, reset } = useCloudflareChallenge()

const isReloading = ref(false)

const showDialog = useRouteQuery("showCloudflareChallenge", "false", {
  transform: {
    get(value: string) {
      // A failed first navigation has no committed route to hold the visibility query.
      if (router.currentRoute.value === START_LOCATION) return error.value.isPresent

      return booleanTransformer.get(value)
    },
    set: booleanTransformer.set,
  },
})

watch(
  () => error.value.isPresent,
  async (isPresent) => {
    try {
      await router.isReady()
    } catch (navigationError) {
      if (navigationError instanceof CloudflareChallengeError) {
        error.value = navigationError
        return
      }

      throw navigationError
    }

    if (showDialog.value === isPresent) return

    showDialog.value = isPresent
  },
  { immediate: true }
)

function closeAndReload() {
  isReloading.value = true

  reset()

  window.location.reload()
}
</script>
