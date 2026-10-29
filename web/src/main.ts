import { createApp } from "vue"
import { createPinia } from "pinia"

import auth0Plugin from "@/plugins/auth0-plugin"
import vuetifyPlugin from "@/plugins/vuetify-plugin"

import router from "@/router"
import { UnexpectedApiResponseError } from "@/api/errors/unexpected-api-response-error"
import useSnack from "@/use/use-snack"

import App from "@/App.vue"

const pinia = createPinia()
const app = createApp(App)
app.use(pinia).use(router).use(vuetifyPlugin).use(auth0Plugin)

app.config.errorHandler = (error) => {
  if (error instanceof UnexpectedApiResponseError) {
    useSnack().error(error.message, { cause: error })
    return
  }

  console.error(error)
}

app.mount("#app")
