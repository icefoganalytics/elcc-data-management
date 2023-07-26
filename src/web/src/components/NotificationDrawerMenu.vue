<template>
  <v-menu :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-btn
        stacked
        v-bind="props"
        @click="markAllAsRead"
      >
        <v-icon
          :color="hasUnreadNotification ? 'error' : 'none'"
          :icon="
            hasUnreadNotification
              ? 'mdi-bell-badge-outline'
              : 'mdi-bell-outline'
          "
        ></v-icon>
      </v-btn>
    </template>

    <v-list>
      <v-list-item>
        <v-list-item-title
          class="font-weight-bold text-primary"
        >
          Notifications
        </v-list-item-title>
        <template v-slot:append>
          <v-badge
            color="info"
            :content="`${unreadCount} New`"
            inline
          ></v-badge>
        </template>
      </v-list-item>
      <v-list-item
        v-for="(item, i) in items"
        :key="i"
      >
        <v-list-item-title
          :class="item.read ? 'font-weight-regular' : 'font-weight-bold'"
          >{{ item.title }}</v-list-item-title
        >
      </v-list-item>
      <v-list-item>
        <v-btn
          variant="outlined"
          color="primary"
          class="text-none"
          >See All Notifications
        </v-btn>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts" setup>
import { sumBy } from "lodash"
import { computed, ref } from "vue"

const items = ref([
  { title: "notification1", read: false },
  { title: "notification2", read: false },
  { title: "notification3", read: false },
])

const unreadCount = computed(
  () => items.value.filter((item) => !item.read).length
)
const hasUnreadNotification = computed(() => unreadCount.value > 0)

function markAllAsRead() {
  items.value.forEach((item) => (item.read = true))
}
</script>
