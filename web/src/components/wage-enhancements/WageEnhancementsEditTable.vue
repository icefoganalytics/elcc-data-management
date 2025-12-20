<template>
  <EditDataTableVirtual
    :headers="headers"
    :items="wageEnhancementsWithTier"
    :loading="isLoading || isSaving"
    :editable-columns="['employeeName', 'hoursEstimated', 'hoursActual']"
    disable-sort
    @update:cell="saveWageEnhancementIfDirty"
  >
    <template #item.tierLabel="{ item }">
      {{ item.tierLabel }}
    </template>

    <template #item.employeeName="{ item }">
      {{ item.employeeName }}
    </template>

    <template #item.wageRatePerHour="{ item }">
      {{ formatMoney(item.wageRatePerHour) }}
    </template>

    <template #item.hoursEstimated="{ item }">
      {{ item.hoursEstimated }}
    </template>

    <template #item.estimatedTotal="{ item }">
      {{ formatMoney(item.estimatedTotal) }}
    </template>

    <template #item.hoursActual="{ item }">
      {{ item.hoursActual }}
    </template>

    <template #item.actualTotal="{ item }">
      {{ formatMoney(item.actualTotal) }}
    </template>

    <template #item.actions="{ item }">
      <v-btn
        icon="mdi-close"
        title="Delete"
        color="error"
        density="comfortable"
        variant="text"
        :loading="isDeletingByWageEnhancementId.get(item.id)"
        @click.stop="deleteWageEnhancement(item.id)"
      />
    </template>

    <template #item.employeeName.edit="{ item }">
      <v-text-field
        v-model="item.employeeName"
        hide-details
      />
    </template>

    <template #item.hoursEstimated.edit="{ item }">
      <v-text-field
        v-model="item.hoursEstimated"
        hide-details
      />
    </template>

    <template #item.hoursActual.edit="{ item }">
      <v-text-field
        v-model="item.hoursActual"
        hide-details
      />
    </template>

    <template #tfoot>
      <tfoot>
        <tr class="bg-grey-lighten-3 font-weight-medium thin-solid-black-top-border">
          <td colspan="4"></td>
          <td>{{ formatMoney(wageEnhancementsEstimatedSubtotal) }}</td>
          <td></td>
          <td>{{ formatMoney(wageEnhancementsActualSubtotal) }}</td>
          <td></td>
        </tr>
        <tr class="bg-grey-lighten-3">
          <td>Plus {{ eiCppWcbRatePercentage }}%, EI, CPP, WCB</td>
          <td></td>
          <td>{{ eiCppWcbRatePercentage }}%</td>
          <td></td>
          <td>{{ formatMoney(wageEnhancementsEstimatedEiCppWcbTotal) }}</td>
          <td></td>
          <td>{{ formatMoney(wageEnhancementsActualEiCppWcbTotal) }}</td>
          <td></td>
        </tr>
        <tr class="bg-grey-lighten-3 font-weight-bold thin-solid-black-top-border thicker-double-black-bottom-border">
          <td class="text-uppercase">Section Total</td>
          <td colspan="3"></td>
          <td>{{ formatMoney(wageEnhancementsEstimatedTotal) }}</td>
          <td></td>
          <td>{{ formatMoney(wageEnhancementsActualTotal) }}</td>
          <td></td>
        </tr>
      </tfoot>
    </template>
  </EditDataTableVirtual>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { isNil, keyBy, pick, sortBy } from "lodash"
import Big from "big.js"

import { formatMoney } from "@/utils/formatters"

import { MAX_PER_PAGE } from "@/api/base-api"
import wageEnhancementsApi, { type WageEnhancementAsIndex } from "@/api/wage-enhancements-api"
import useWageEnhancements, { EI_CPP_WCB_RATE } from "@/use/use-wage-enhancements"
import useSnack from "@/use/use-snack"

import EditDataTableVirtual from "@/components/common/EditDataTableVirtual.vue"

type WageEnhancementWithTier = WageEnhancementAsIndex & {
  tierLabel: string
  tierLevel: number
  wageRatePerHour: string
  estimatedTotal: string
  actualTotal: string
}

const props = defineProps<{
  centreId: number
  fiscalPeriodId: number
}>()

const wageEnhancementsQuery = computed(() => ({
  where: {
    centreId: props.centreId,
  },
  filters: {
    byFiscalPeriodId: props.fiscalPeriodId,
  },
  perPage: MAX_PER_PAGE,
}))

const {
  wageEnhancements,
  isLoading,
  refresh,
} = useWageEnhancements(wageEnhancementsQuery)

const wageEnhancementsWithTier = computed<WageEnhancementWithTier[]>(() => {
  const enhanced = wageEnhancements.value.map((wageEnhancement) => {
    const { employeeWageTier } = wageEnhancement
    const wageRatePerHour = employeeWageTier?.wageRatePerHour ?? "0"
    const estimatedTotal = isNil(wageEnhancement.hoursEstimated)
      ? "0"
      : Big(wageEnhancement.hoursEstimated).mul(wageRatePerHour).toFixed(4)
    const actualTotal = isNil(wageEnhancement.hoursActual)
      ? "0"
      : Big(wageEnhancement.hoursActual).mul(wageRatePerHour).toFixed(4)

    return {
      ...wageEnhancement,
      tierLabel: employeeWageTier?.tierLabel ?? "Unknown",
      tierLevel: employeeWageTier?.tierLevel ?? 0,
      wageRatePerHour,
      estimatedTotal,
      actualTotal,
    }
  })

  return sortBy(enhanced, ["tierLevel", "employeeName"])
})

const wageEnhancementsById = computed<Record<number, WageEnhancementWithTier>>(() =>
  keyBy(wageEnhancementsWithTier.value, "id")
)
const wageEnhancementIdToIndex = computed<Record<number, number>>(() =>
  Object.fromEntries(
    wageEnhancementsWithTier.value.map((wageEnhancement, index) => [wageEnhancement.id, index])
  )
)

const headers = [
  { title: "Tier", key: "tierLabel" },
  { title: "Employee Name", key: "employeeName" },
  { title: "Per Employee", key: "wageRatePerHour" },
  { title: "Est. Hours", key: "hoursEstimated" },
  { title: "Est. Total", key: "estimatedTotal" },
  { title: "Act. Hours", key: "hoursActual" },
  { title: "Act. Total", key: "actualTotal" },
  { title: "", key: "actions", sortable: false },
]

const wageEnhancementsEstimatedSubtotal = computed(() =>
  wageEnhancementsWithTier.value.reduce(
    (total, { estimatedTotal }) => Big(total).add(Big(estimatedTotal)),
    Big(0)
  ).toFixed(4)
)

const wageEnhancementsActualSubtotal = computed(() =>
  wageEnhancementsWithTier.value.reduce(
    (total, { actualTotal }) => Big(total).add(Big(actualTotal)),
    Big(0)
  ).toFixed(4)
)

const wageEnhancementsEstimatedEiCppWcbTotal = computed(() =>
  Big(wageEnhancementsEstimatedSubtotal.value).mul(Big(EI_CPP_WCB_RATE)).toFixed(4)
)

const wageEnhancementsActualEiCppWcbTotal = computed(() =>
  Big(wageEnhancementsActualSubtotal.value).mul(Big(EI_CPP_WCB_RATE)).toFixed(4)
)

const wageEnhancementsEstimatedTotal = computed(() =>
  Big(wageEnhancementsEstimatedSubtotal.value).mul(Big(1).plus(Big(EI_CPP_WCB_RATE))).toFixed(4)
)

const wageEnhancementsActualTotal = computed(() =>
  Big(wageEnhancementsActualSubtotal.value).mul(Big(1).plus(Big(EI_CPP_WCB_RATE))).toFixed(4)
)

const eiCppWcbRatePercentage = computed(() => Big(EI_CPP_WCB_RATE).mul(Big(100)).toFixed(2))

const isSaving = ref(false)
const isDeletingByWageEnhancementId = reactive(new Map<number, boolean>())
const snack = useSnack()

async function saveWageEnhancementIfDirty(wageEnhancement: WageEnhancementWithTier) {
  const currentWageEnhancement = wageEnhancementsById.value[wageEnhancement.id]
  if (JSON.stringify(currentWageEnhancement) === JSON.stringify(wageEnhancement)) return

  isSaving.value = true
  try {
    const wageEnhancementAttributes = pick(wageEnhancement, [
      "employeeName",
      "hoursEstimated",
      "hoursActual",
    ])
    const { wageEnhancement: updatedWageEnhancement } = await wageEnhancementsApi.update(
      wageEnhancement.id,
      wageEnhancementAttributes
    )

    const wageEnhancementIndex = wageEnhancementIdToIndex.value[wageEnhancement.id]
    if (isNil(wageEnhancementIndex)) return

    wageEnhancements.value.splice(wageEnhancementIndex, 1, {
      ...wageEnhancements.value[wageEnhancementIndex],
      ...updatedWageEnhancement,
    })

    snack.success("Wage enhancement saved!")
  } catch (error) {
    console.error(`Failed to save wage enhancement: ${error}`, { error })
    snack.error(`Failed to save wage enhancement: ${error}`)
  } finally {
    isSaving.value = false
  }
}

async function deleteWageEnhancement(wageEnhancementId: number) {
  isDeletingByWageEnhancementId.set(wageEnhancementId, true)
  try {
    await wageEnhancementsApi.delete(wageEnhancementId)
    snack.success("Wage enhancement deleted")
    await refresh()
  } catch (error) {
    console.error(`Failed to delete wage enhancement: ${error}`, { error })
    snack.error(`Failed to delete wage enhancement: ${error}`)
  } finally {
    isDeletingByWageEnhancementId.delete(wageEnhancementId)
  }
}

defineExpose({
  refresh,
})
</script>

<style scoped>
.thin-solid-black-top-border > td {
  border-top: thin solid black;
}

.thicker-double-black-bottom-border > td {
  border-bottom: 3px double black;
}
</style>
