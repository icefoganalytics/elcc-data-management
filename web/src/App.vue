<template>
  <v-app>
    <router-view v-if="isUnauthenticatedRoute"></router-view>
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
    <AppSnackbar />
    <CloudflareChallengeDialog />
  </v-app>
</template>

<script lang="ts" setup>
import { computed, onErrorCaptured, ref, watch } from "vue"
import { useAuth0 } from "@auth0/auth0-vue"
import { useRoute, useRouter } from "vue-router"

import ApiOperationError from "@/api/errors/api-operation-error"
import AuthenticationRequiredError from "@/api/errors/authentication-required-error"
import CloudflareChallengeError from "@/api/errors/cloudflare-challenge-error"
import UnexpectedApiResponseError from "@/api/errors/unexpected-api-response-error"

import useCurrentUser from "@/use/use-current-user"
import useCloudflareChallenge from "@/use/use-cloudflare-challenge"

import PageLoader from "@/components/common/PageLoader.vue"
import AppSnackbar from "@/components/layouts/AppSnackbar.vue"
import CloudflareChallengeDialog from "@/components/CloudflareChallengeDialog.vue"

const route = useRoute()
const isUnauthenticatedRoute = computed(() => route.meta.requiresAuth === false)

const { isLoading: isLoadingAuth0, isAuthenticated, loginWithRedirect } = useAuth0()
const isReadyAuth0 = computed(() => !isLoadingAuth0.value && isAuthenticated.value)

const { isReady: isReadyCurrentUser, isLoading: isLoadingCurrentUser, fetch } = useCurrentUser()

const isReady = computed(() => isReadyAuth0.value && isReadyCurrentUser.value)
const { error: cloudflareChallengeError } = useCloudflareChallenge()

const isErrored = ref(false)
const router = useRouter()

watch(
  () => isReadyAuth0.value,
  async (newIsReadyAuth0) => {
    // Don't bother attempting to load current user for unathenticated routes
    if (isUnauthenticatedRoute.value) return

    if (newIsReadyAuth0 === true) {
      try {
        await fetch()
      } catch (error) {
        if (error instanceof AuthenticationRequiredError) {
          await router.isReady()
          await loginWithRedirect({
            appState: { target: route.fullPath },
          })
          return
        }

        if (error instanceof CloudflareChallengeError) {
          cloudflareChallengeError.value = error
          return
        }

        await router.isReady()
        if (error instanceof ApiOperationError) {
          console.log("Failed to load current user:", error)

          if (error.status === 400) {
            await router.replace({
              name: "errors/InternalServerErrorPage",
            })
          } else {
            await redirectToAppropriateErrorPage(error.status)
          }

          isErrored.value = true
          return
        }

        await router.replace({
          name: "errors/InternalServerErrorPage",
        })
        isErrored.value = true
        if (error instanceof UnexpectedApiResponseError) {
          console.error(`Unexpected API response while loading current user: ${error}`, { error })
          return
        }

        throw error
      }
    }
  },
  { immediate: true }
)

onErrorCaptured((error: Error) => {
  if (error instanceof CloudflareChallengeError) {
    cloudflareChallengeError.value = error
    return false
  }

  if (error instanceof ApiOperationError) {
    redirectToAppropriateErrorPage(error.status)
  }
})

function redirectToAppropriateErrorPage(httpErrorCode: number) {
  if (httpErrorCode === 400 || httpErrorCode === 422) return

  switch (httpErrorCode) {
    case 401:
      return router.replace({
        name: "errors/UnauthorizedPage",
      })
    case 403:
      return router.replace({
        name: "errors/ForbiddenPage",
      })
    case 404:
      return router.replace({
        name: "errors/NotFoundPage",
      })
    default:
      return router.replace({
        name: "errors/InternalServerErrorPage",
      })
  }
}
</script>
