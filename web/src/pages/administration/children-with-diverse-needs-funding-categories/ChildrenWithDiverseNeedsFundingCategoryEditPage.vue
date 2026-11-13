<template>
  <v-skeleton-loader
    v-if="isNil(childrenWithDiverseNeedsFundingCategory)"
    type="card"
  />
  <template v-else>
    <v-row>
      <v-col cols="12">
        <v-text-field
          :model-value="fundingPeriodDescription"
          append-inner-icon="mdi-lock"
          label="Funding Period"
          readonly
        />
      </v-col>
    </v-row>
    <ChildrenWithDiverseNeedsFundingCategoryEditForm
      :children-with-diverse-needs-funding-category-id="childrenWithDiverseNeedsFundingCategoryId"
    />
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { isNil } from "lodash"

import useChildrenWithDiverseNeedsFundingCategory from "@/use/use-children-with-diverse-needs-funding-category"
import useFundingPeriod from "@/use/use-funding-period"
import useBreadcrumbs from "@/use/use-breadcrumbs"

import ChildrenWithDiverseNeedsFundingCategoryEditForm from "@/components/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryEditForm.vue"

const props = defineProps<{
  childrenWithDiverseNeedsFundingCategoryId: string
}>()

const childrenWithDiverseNeedsFundingCategoryId = computed(() =>
  Number(props.childrenWithDiverseNeedsFundingCategoryId)
)
const { childrenWithDiverseNeedsFundingCategory } = useChildrenWithDiverseNeedsFundingCategory(
  childrenWithDiverseNeedsFundingCategoryId
)

const fundingPeriodId = computed(
  () => childrenWithDiverseNeedsFundingCategory.value?.fundingPeriodId
)
const { fundingPeriod } = useFundingPeriod(fundingPeriodId)
const fundingPeriodDescription = computed(() => fundingPeriod.value?.fiscalYear ?? "Unknown")

useBreadcrumbs("Edit Diverse Need Category", [
  {
    title: "Administration",
    to: {
      name: "AdministrationPage",
    },
  },
  {
    title: "Diverse Need Categories",
    to: {
      name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage",
    },
  },
  {
    title: "Edit Category",
    to: {
      name: "administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryEditPage",
      params: {
        childrenWithDiverseNeedsFundingCategoryId: childrenWithDiverseNeedsFundingCategoryId.value,
      },
    },
  },
])
</script>
