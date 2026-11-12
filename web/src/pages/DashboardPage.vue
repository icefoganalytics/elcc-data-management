<template>
  <div>
    <v-row>
      <v-col cols="4">
        <v-card
          elevation="3"
          color="#DC440566"
          :to="{
            name: 'ChildCareCentresPage',
          }"
        >
          <v-card-text
            style="text-align: right"
            color="white"
          >
            <v-icon
              class="float-left"
              style="font-size: 90px; opacity: 25%; position: absolute; left: 10px"
              >mdi-home</v-icon
            >
            <div>Managing</div>
            <div
              aria-label="Child care centre count"
              aria-live="polite"
              style="font-size: 52px; line-height: 52px"
            >
              {{ centreCount }}
            </div>
            <div>Child Care Centres</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card
          elevation="3"
          color="yg-blue-light"
        >
          <v-card-text
            style="text-align: right"
            color="white"
          >
            <v-icon
              class="float-left"
              style="font-size: 90px; opacity: 25%; position: absolute; left: 10px"
              >mdi-map</v-icon
            >
            <div>Located In</div>
            <div
              aria-label="Community count"
              aria-live="polite"
              style="font-size: 52px; line-height: 52px"
            >
              {{ communityCount }}
            </div>
            <div>Communities</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card
          elevation="3"
          color="#F2A90066"
        >
          <v-card-text style="text-align: right">
            <v-icon
              class="float-left"
              style="font-size: 90px; opacity: 25%; position: absolute; left: 10px"
              >mdi-account-child</v-icon
            >
            <div>Serving</div>
            <div style="font-size: 52px; line-height: 52px">15,514</div>
            <div>Yukon Children</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card
          elevation="3"
          color="#7A9A0166"
        >
          <v-card-text style="text-align: right">
            <VueApexCharts
              width="100%"
              type="bar"
              height="250"
              :options="chartOptions"
              :series="chartSeries"
            ></VueApexCharts>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import VueApexCharts from "vue3-apexcharts"

import useBreadcrumbs from "@/use/use-breadcrumbs"
import useCentreStatistics from "@/use/use-centre-statistics"

const { statistics, isLoading } = useCentreStatistics()

const centreCount = computed(() => {
  if (isLoading.value) return "Loading…"
  if (statistics.value === null) return "Unavailable"

  return statistics.value.centreCount
})
const communityCount = computed(() => {
  if (isLoading.value) return "Loading…"
  if (statistics.value === null) return "Unavailable"

  return statistics.value.communityCount
})

const chartOptions = {
  chart: {
    id: "vuechart-example",
  },
  xaxis: {
    categories: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
  },
}
const chartSeries = [
  {
    name: "Enrollment",
    color: "#7A9A01",
    data: [30, 40, 45, 50, 49, 60, 70, 91],
  },
]

useBreadcrumbs("ELCC Home", [])
</script>
