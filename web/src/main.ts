import { createApp } from "vue"

import auth0Plugin from "@/plugins/auth0-plugin"
import vuetifyPlugin from "@/plugins/vuetify-plugin"
import apiResponseErrorPlugin from "@/plugins/api-response-error-plugin"

import router from "@/router"

import App from "@/App.vue"

const app = createApp(App)
app.use(router).use(vuetifyPlugin).use(auth0Plugin)

app.use(apiResponseErrorPlugin)

app.mount("#app")
