<template>
  <v-skeleton-loader
    v-if="isNil(childrenWithDiverseNeedsFundingCategory)"
    type="card"
  />
  <HeaderActionsCard
    v-else
    title="Diverse Need Category Details"
  >
    <template #header-actions>
      <v-btn
        v-if="policy?.update"
        color="primary"
        :to="{
          name: 'administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryEditPage',
          params: {
            childrenWithDiverseNeedsFundingCategoryId,
          },
        }"
      >
        Edit
      </v-btn>
      <v-btn
        v-if="policy?.destroy"
        color="error"
        :loading="isDeleting"
        :disabled="isDeleting"
        @click="retireChildrenWithDiverseNeedsFundingCategory"
      >
        Retire
      </v-btn>
    </template>
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <DescriptionElement
          :model-value="childrenWithDiverseNeedsFundingCategory.categoryName"
          label="Category Name"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <DescriptionElement
          :model-value="fundingPeriodDescription"
          :loading="isLoadingFundingPeriod"
          label="Funding Period"
          vertical
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        md="4"
      >
        <DescriptionElement
          :model-value="childrenWithDiverseNeedsFundingCategory.fromAge ?? '—'"
          label="From Age"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <DescriptionElement
          :model-value="childrenWithDiverseNeedsFundingCategory.toAge ?? '—'"
          label="To Age"
          vertical
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <DescriptionElement
          :model-value="
            formatMoney(childrenWithDiverseNeedsFundingCategory.monthlyAmount, {
              maximumFractionDigits: 4,
            })
          "
          label="Monthly Amount"
          vertical
        />
      </v-col>
    </v-row>
  </HeaderActionsCard>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { isNil } from "lodash"

import childrenWithDiverseNeedsFundingCategoriesApi from "@/api/children-with-diverse-needs-funding-categories-api"
import rethrowUnexpectedError from "@/api/errors/rethrow-unexpected-error"

import { formatMoney } from "@/utils/formatters"
import blockedToTrueConfirm from "@/utils/blocked-to-true-confirm"

import useChildrenWithDiverseNeedsFundingCategory from "@/use/use-children-with-diverse-needs-funding-category"
import useFundingPeriod from "@/use/use-funding-period"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useSnack from "@/use/use-snack"

import HeaderActionsCard from "@/components/common/HeaderActionsCard.vue"
import DescriptionElement from "@/components/common/DescriptionElement.vue"

const props = defineProps<{
  childrenWithDiverseNeedsFundingCategoryId: string
}>()

const childrenWithDiverseNeedsFundingCategoryId = computed(() =>
  Number(props.childrenWithDiverseNeedsFundingCategoryId)
)
const { childrenWithDiverseNeedsFundingCategory, policy } =
  useChildrenWithDiverseNeedsFundingCategory(childrenWithDiverseNeedsFundingCategoryId)

const fundingPeriodId = computed(
  () => childrenWithDiverseNeedsFundingCategory.value?.fundingPeriodId
)
const { fundingPeriod, isLoading: isLoadingFundingPeriod } = useFundingPeriod(fundingPeriodId)
const fundingPeriodDescription = computed(() => fundingPeriod.value?.fiscalYear ?? "Unavailable")

const isDeleting = ref(false)

const snack = useSnack()

const router = useRouter()

async function retireChildrenWithDiverseNeedsFundingCategory() {
  if (
    !policy.value?.destroy ||
    isDeleting.value ||
    !blockedToTrueConfirm("Are you sure you want to retire this diverse need category?")
  ) {
    return
  }

  isDeleting.value = true
  try {
    await childrenWithDiverseNeedsFundingCategoriesApi.delete(
      childrenWithDiverseNeedsFundingCategoryId.value
    )
    snack.success("Diverse need category retired successfully!")
    await router.push({
      name: "administration/ChildrenWithDiverseNeedsFundingCategoriesPage",
    })
  } catch (error) {
    rethrowUnexpectedError(error)

    snack.error(`Failed to retire diverse need category: ${error}`)
  } finally {
    isDeleting.value = false
  }
}

useBreadcrumbs("Diverse Need Category Details", [
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
    title: "Details",
    to: {
      name: "administration/children-with-diverse-needs-funding-categories/ChildrenWithDiverseNeedsFundingCategoryPage",
      params: {
        childrenWithDiverseNeedsFundingCategoryId: childrenWithDiverseNeedsFundingCategoryId.value,
      },
    },
  },
])
</script>
