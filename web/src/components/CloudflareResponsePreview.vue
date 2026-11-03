<template>
  <section
    class="mt-4"
    aria-labelledby="cloudflare-response-preview-heading"
  >
    <h3
      id="cloudflare-response-preview-heading"
      class="text-subtitle-1"
    >
      Optional Cloudflare response preview
    </h3>
    <v-alert
      type="warning"
      color="surface"
      border="start"
      border-color="warning"
      variant="flat"
      class="position-sticky top-0 z-1 mt-2"
      role="alert"
    >
      This response is untrusted and its text may be misleading. Do not enter credentials, run
      commands, follow instructions, or copy commands from the preview. Use ELCC's normal support
      route for help. This preview cannot complete Cloudflare verification.
    </v-alert>
    <v-checkbox
      v-model="hasAcknowledgedUntrustedContent"
      label="I understand this preview is untrusted and its text may be misleading."
      hide-details
      class="mt-2"
    />
    <v-btn
      variant="outlined"
      :disabled="!hasAcknowledgedUntrustedContent"
      @click="revealPreview"
    >
      Reveal sanitized preview
    </v-btn>
    <div
      v-if="isPreviewVisible"
      class="mt-2"
    >
      <iframe
        :srcdoc="previewDocument"
        class="d-block h-24rem max-h-50vh bg-white w-100 border rounded"
        title="Sanitized, untrusted Cloudflare response preview"
        referrerpolicy="no-referrer"
        sandbox=""
      />
      <v-btn
        variant="text"
        class="mt-2"
        aria-label="Hide Cloudflare response preview"
        @click="hidePreview"
      >
        Hide preview
      </v-btn>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"

import buildCloudflareResponsePreviewDocument from "@/lib/cloud-flare/build-cloudflare-response-preview-document"

const props = defineProps<{
  html: string
}>()

const hasAcknowledgedUntrustedContent = ref(false)
const isPreviewVisible = ref(false)
const previewDocument = computed(() => buildCloudflareResponsePreviewDocument(props.html))

watch(
  () => props.html,
  () => {
    hasAcknowledgedUntrustedContent.value = false
    isPreviewVisible.value = false
  },
  { flush: "sync" }
)

watch(hasAcknowledgedUntrustedContent, (hasAcknowledged) => {
  if (!hasAcknowledged) {
    isPreviewVisible.value = false
  }
})

function revealPreview() {
  if (!hasAcknowledgedUntrustedContent.value) {
    return
  }

  isPreviewVisible.value = true
}

function hidePreview() {
  hasAcknowledgedUntrustedContent.value = false
  isPreviewVisible.value = false
}
</script>

<style scoped>
.z-1 {
  z-index: 1;
}

.h-24rem {
  height: 24rem;
}

.max-h-50vh {
  max-height: 50vh;
}
</style>
