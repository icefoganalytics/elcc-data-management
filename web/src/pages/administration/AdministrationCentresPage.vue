<template>
  <HeaderActionsCard>
    <template #header>
      <v-text-field
        :model-value="search"
        label="Search"
        append-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        class="mr-md-4"
        @update:model-value="debounceUpdateSearch"
      />
    </template>
    <template #header-actions>
      <v-btn
        color="primary"
        @click="openCentreCreateDialog"
      >
        <v-icon class="mr-3">mdi-plus</v-icon>
        New Centre
      </v-btn>
    </template>

    <CentresDeleteDataTableServer :filters="centreFilters" />
  </HeaderActionsCard>

  <CentreCreateDialog
    ref="centreCreateDialog"
    @created="goToCentre"
  />
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue"
import { debounce, isNil } from "lodash"
import { useRouter } from "vue-router"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import { type CentreFiltersOptions } from "@/use/use-centres"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import CentresDeleteDataTableServer from "@/components/centres/CentresDeleteDataTableServer.vue"
import CentreCreateDialog from "@/modules/centre/components/CentreCreateDialog.vue"

const search = ref("")

function updateSearch(value: string) {
  search.value = value
}

const debounceUpdateSearch = debounce(updateSearch, 500)

const centreFilters = computed(() => {
  const filters: CentreFiltersOptions = {}

  if (search.value) {
    filters.search = search.value
  }

  return filters
})

const centreCreateDialog = useTemplateRef("centreCreateDialog")

function openCentreCreateDialog() {
  if (isNil(centreCreateDialog.value)) {
    throw new Error("Centre create dialog is not ready")
  }

  centreCreateDialog.value.open()
}

const router = useRouter()

function goToCentre(centreId: number) {
  return router.push({
    name: "child-care-centers/ChildCareCenterRedirect",
    params: {
      centreId,
    },
  })
}

useBreadcrumbs("Centres", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Centres",
    to: {
      name: "administration/CentresPage",
    },
  },
])
</script>
