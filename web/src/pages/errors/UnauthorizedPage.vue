<template>
  <v-empty-state
    headline="Whoops, 401"
    title="Unauthorized"
    text="If you think this is an error, please contact support. Alternatively, try logging out and signing back in."
    :image="SplashImage"
  >
    <v-row>
      <v-col class="d-flex justify-center">
        <v-btn
          color="primary"
          width="200"
          variant="outlined"
          @click="goBack"
          >Back</v-btn
        >
      </v-col>
    </v-row>
    <v-row>
      <v-col class="d-flex justify-center">
        <!-- href="/" performs a more aggressive refresh than using to="xxx" -->
        <v-btn
          href="/"
          color="primary"
          width="200"
          variant="outlined"
          >Home</v-btn
        >
      </v-col>
    </v-row>
    <v-row>
      <v-col class="d-flex justify-center">
        <v-btn
          width="200"
          @click="signOut"
          >Logout</v-btn
        >
      </v-col>
    </v-row>
  </v-empty-state>
</template>

<script lang="ts" setup>
import SplashImage from "@/assets/logo.svg"
import { useAuth0 } from "@auth0/auth0-vue"

import useCurrentUser from "@/use/use-current-user"

const { logout } = useAuth0()
const { reset: resetCurrentUser } = useCurrentUser()

function goBack() {
  window.history.back()
}

async function signOut() {
  resetCurrentUser()

  const returnTo = encodeURI(window.location.origin + "/sign-in")
  return logout({
    logoutParams: {
      returnTo,
    },
  })
}
</script>
