<template>
  <div>
    <CurrencyInput v-model="amount" />
    <output>{{ typeof amount }}:{{ amount }}</output>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"

import CurrencyInput from "@/components/CurrencyInput.vue"

const props = defineProps<{
  initialAmount: string
}>()

const amount = ref(props.initialAmount)
</script>
