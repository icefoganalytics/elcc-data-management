<template>
  <v-app>
    <router-view v-if="isUnauthenticatedRoute"></router-view>
    <v-container v-else-if="isStartupFailed">
      <v-alert
        type="error"
        title="Unable to load your account"
      >
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
    <router-view v-else-if="isReady" />
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
import { useRoute } from "vue-router"

import useCurrentUser from "@/use/use-current-user"
import { useApiStore } from "@/store/ApiStore"

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

const isStartupFailed = ref(false)

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
  isStartupFailed.value = false
  try {
    await fetch()
  } catch (error) {
    isStartupFailed.value = !isCachedCurrentUser.value
    throw error
  }
}
</script>
