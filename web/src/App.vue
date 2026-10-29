<template>
  <v-app>
    <router-view v-if="isUnauthenticatedRoute"></router-view>
    <v-container v-else-if="startupError">
      <v-alert
        type="error"
        title="Unable to load your account"
      >
        <p>{{ startupError.message }}</p>
        <p>Your account is not ready. Protected pages have not been opened.</p>
        <v-btn
          class="mt-3"
          @click="loadCurrentUser"
        >
          Retry Account Loading
        </v-btn>
      </v-alert>
    </v-container>
    <!--
        NOTE: current user will always be defined when the authenticated router view loads.
      -->
    <router-view v-else-if="isReady || isErrored" />
    <PageLoader
      v-else-if="isReadyAuth0 && isLoadingCurrentUser"
      message="Fetching and syncing user"
    />
    <PageLoader
      v-else-if="isLoadingAuth0"
      message="Checking authentication status ..."
    />
    <PageLoader
      v-else
      message="Initializing app ..."
    />
    <Notifications />
    <AppSnackbar />
  </v-app>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useAuth0 } from "@auth0/auth0-vue"
import { useRoute, useRouter } from "vue-router"

import useCurrentUser from "@/use/use-current-user"
import { useApiStore } from "@/store/ApiStore"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"
import useSnack from "@/use/use-snack"

import PageLoader from "@/components/common/PageLoader.vue"
import AppSnackbar from "@/components/layouts/AppSnackbar.vue"
import Notifications from "@/components/Notifications.vue"

useApiStore()

const route = useRoute()
const isUnauthenticatedRoute = computed(() => route.meta.requiresAuth === false)

const { isLoading: isLoadingAuth0, isAuthenticated } = useAuth0()
const isReadyAuth0 = computed(() => !isLoadingAuth0.value && isAuthenticated.value)

const { isCached: isCachedCurrentUser, isLoading: isLoadingCurrentUser, fetch } = useCurrentUser()

const isReady = computed(() => isReadyAuth0.value && isCachedCurrentUser.value)

const isErrored = ref(false)
const startupError = ref<UnexpectedApiResponseError | null>(null)
const snack = useSnack()
const router = useRouter()

watch(
  () => isReadyAuth0.value,
  async (newIsReadyAuth0) => {
    // Don't bother attempting to load current user for unathenticated routes
    if (isUnauthenticatedRoute.value) return

    if (newIsReadyAuth0 === true) {
      await loadCurrentUser()
    }
  },
  { immediate: true }
)

async function loadCurrentUser() {
  startupError.value = null
  isErrored.value = false
  try {
    await fetch()
    snack.reset()
  } catch (error) {
    if (error instanceof UnexpectedApiResponseError) {
      if (!isCachedCurrentUser.value) startupError.value = error
      snack.error(error.message, { cause: error })
      return
    }

    console.error(`Failed to load current user: ${error}`, { error })
    await router.isReady()
    await router.push({ name: "SignInPage" })
    isErrored.value = true
  }
}
</script>
