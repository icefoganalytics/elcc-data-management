<template>
  <v-empty-state
    v-if="!isSystemAdmin"
    class="ma-5"
    icon="mdi-lock-outline"
    headline="Editing Not Allowed"
    title="Only system administrators can create diverse need categories."
  />
  <HeaderActionsFormCard
    v-else
    ref="form"
    title="New Diverse Need Category"
    @submit.prevent="createCategory"
  >
    <FundingPeriodSearchableAutocomplete
      v-model="attributes.fundingPeriodId"
      :disabled="isCreating"
      :rules="[required]"
    />
    <v-text-field
      v-model="attributes.categoryName"
      label="Category Name *"
      :rules="[required]"
      :disabled="isCreating"
    />
    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <NumberTextField
          v-model="attributes.fromAge"
          label="From Age"
          min="0"
          step="1"
          :disabled="isCreating"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <NumberTextField
          v-model="attributes.toAge"
          label="To Age"
          min="0"
          step="1"
          :disabled="isCreating"
        />
      </v-col>
    </v-row>
    <CurrencyInput
      v-model="attributes.monthlyAmount"
      label="Monthly Amount *"
      :rules="[required]"
      :disabled="isCreating"
    />
    <template #actions>
      <v-btn
        type="submit"
        color="primary"
        :loading="isCreating"
        >Create</v-btn
      >
      <v-spacer />
      <v-btn
        color="warning"
        variant="outlined"
        :to="cancelRoute"
        :disabled="isCreating"
        >Cancel</v-btn
      >
    </template>
  </HeaderActionsFormCard>
</template>

<script setup lang="ts">
import { reactive, ref, useTemplateRef } from "vue"
import { useRoute, useRouter } from "vue-router"

import diverseNeedCategoriesApi from "@/api/diverse-need-categories-api"
import { required } from "@/utils/validators"
import useBreadcrumbs from "@/use/use-breadcrumbs"
import useSnack from "@/use/use-snack"
import useCurrentUser from "@/use/use-current-user"
import CurrencyInput from "@/components/CurrencyInput.vue"
import HeaderActionsFormCard from "@/components/common/HeaderActionsFormCard.vue"
import NumberTextField from "@/components/common/NumberTextField.vue"
import FundingPeriodSearchableAutocomplete from "@/components/funding-periods/FundingPeriodSearchableAutocomplete.vue"

const route = useRoute()
const router = useRouter()
const attributes = reactive({
  fundingPeriodId: Number(route.query.fundingPeriodId) || (null as number | null),
  categoryName: "",
  fromAge: null as number | null,
  toAge: null as number | null,
  monthlyAmount: "",
})
const isCreating = ref(false)
const form = useTemplateRef("form")
const snack = useSnack()
const { isSystemAdmin } = useCurrentUser()
const cancelRoute = {
  name: "administration/DiverseNeedCategoriesPage",
}

async function createCategory() {
  if (!form.value || !isSystemAdmin.value || isCreating.value) return
  const { valid } = await form.value.validate()
  if (!valid || attributes.fundingPeriodId === null) return

  isCreating.value = true
  try {
    const { diverseNeedCategory } = await diverseNeedCategoriesApi.create({
      fundingPeriodId: attributes.fundingPeriodId,
      categoryName: attributes.categoryName,
      fromAge: attributes.fromAge,
      toAge: attributes.toAge,
      monthlyAmount: attributes.monthlyAmount,
    })
    snack.success("Diverse need category created successfully!")
    await router.push({
      name: "administration/diverse-need-categories/DiverseNeedCategoryPage",
      params: { diverseNeedCategoryId: diverseNeedCategory.id },
    })
  } catch (error) {
    snack.error(`Failed to create diverse need category: ${error}`)
  } finally {
    isCreating.value = false
  }
}

useBreadcrumbs("New Diverse Need Category", [
  { title: "Administration", to: { name: "AdministrationPage" } },
  { title: "Diverse Need Categories", to: { name: "administration/DiverseNeedCategoriesPage" } },
  {
    title: "New Category",
    to: {
      name: "administration/diverse-need-categories/DiverseNeedCategoryNewPage",
      query: route.query,
    },
  },
])
</script>
