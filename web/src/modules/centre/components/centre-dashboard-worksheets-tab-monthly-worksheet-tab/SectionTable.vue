<template>
  <table
    style="width: 100%"
    cellpadding="0"
    cellspacing="0"
    border="0px"
  >
    <tr class="text-left">
      <td style="width: 180px"></td>
      <td
        class="pl-4"
        style="width: 120px"
      >
        Per child
      </td>
      <td
        class="pl-4"
        style="width: 120px"
      >
        Est
      </td>
      <td class="pl-4">Est Total</td>
      <td
        class="pl-4"
        style="width: 120px"
      >
        Act
      </td>
      <td class="pl-4">Act Total</td>
    </tr>
    <tr
      v-for="(line, lineIndex) in lines"
      class="monospace"
    >
      <td>{{ line.lineName }}</td>
      <td>
        <v-text-field
          :value="formatMoney(line.monthlyAmount)"
          density="compact"
          hide-details
          readonly
          style="background-color: #eee"
        ></v-text-field>
      </td>
      <td>
        <v-text-field
          v-model.number="line.estimatedChildOccupancyRate"
          density="compact"
          hide-details
          @change="changeLineAndPropagate(line, lineIndex)"
        ></v-text-field>
      </td>
      <td>
        <v-text-field
          :value="formatMoney(line.estimatedComputedTotal)"
          density="compact"
          hide-details
          readonly
          style="background-color: #eee"
        ></v-text-field>
      </td>
      <td>
        <v-text-field
          v-model.number="line.actualChildOccupancyRate"
          density="compact"
          hide-details
          @change="changeLineAndPropagate(line, lineIndex)"
        ></v-text-field>
      </td>

      <td>
        <v-text-field
          :value="formatMoney(line.actualComputedTotal)"
          density="compact"
          hide-details
          readonly
          style="background-color: #eee"
        ></v-text-field>
      </td>
    </tr>
    <tr class="monospace total">
      <td>SECTION TOTAL</td>
      <td></td>
      <td>
        <v-text-field
          :value="
            lines.reduce(
              (a: number, v: any) => a + parseFloat(v.estimatedChildOccupancyRate || 0),
              0
            )
          "
          density="compact"
          hide-details
          readonly
          style="background-color: #eee"
        ></v-text-field>
      </td>
      <td>
        <v-text-field
          :value="
            formatMoney(
              lines.reduce((a: number, v: any) => a + parseFloat(v.estimatedComputedTotal || 0), 0)
            )
          "
          density="compact"
          hide-details
          readonly
          style="background-color: #eee"
        ></v-text-field>
      </td>
      <td>
        <v-text-field
          :value="
            lines.reduce((a: number, v: any) => a + parseFloat(v.actualChildOccupancyRate || 0), 0)
          "
          density="compact"
          hide-details
          readonly
          style="background-color: #eee"
        ></v-text-field>
      </td>
      <td>
        <v-text-field
          :value="
            formatMoney(
              lines.reduce((a: number, v: any) => a + parseFloat(v.actualComputedTotal || 0), 0)
            )
          "
          density="compact"
          hide-details
          readonly
          style="background-color: #eee"
        ></v-text-field>
      </td>
    </tr>
  </table>
</template>

<script lang="ts" setup>
import { type FundingLineValue } from "@/store/funding-submission-line-jsons"
import { formatMoney } from "@/utils"

defineProps<{
  lines: FundingLineValue[]
}>()

const emit = defineEmits<{
  lineChanged: [{ line: FundingLineValue; lineIndex: number }]
}>()

function refreshLineTotals(line: FundingLineValue) {
  line.estimatedComputedTotal = line.monthlyAmount * line.estimatedChildOccupancyRate
  line.actualComputedTotal = line.monthlyAmount * line.actualChildOccupancyRate
}

function changeLineAndPropagate(line: FundingLineValue, lineIndex: number) {
  line.estimatedChildOccupancyRate = line.estimatedChildOccupancyRate || 0
  line.actualChildOccupancyRate = line.actualChildOccupancyRate || 0
  refreshLineTotals(line)

  emit("lineChanged", { line, lineIndex })
}

defineExpose({
  refreshLineTotals,
})
</script>

<style scoped>
.monospace .v-text-field .v-field input.v-field__input {
  font-family: "Courier Prime", monospace !important;
}
.monospace.total .v-text-field .v-field input.v-field__input {
  font-weight: 700;
}
</style>
