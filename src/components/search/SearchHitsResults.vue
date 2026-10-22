<template>
  <search-hits-ledger v-if="layout === 'table'" :items="items" @deleted="onDeleted" />
  <search-hits-grid v-else :items="items" @deleted="onDeleted" />
</template>

<script setup lang="ts">
import SearchHitsGrid from './SearchHitsGrid.vue';
import SearchHitsLedger from './SearchHitsLedger.vue';
import { useHitsLayout } from './useHitsLayout';
import type { HitItem } from './hitValue';

defineProps<{
  items: HitItem[];
}>();
const emit = defineEmits<(e: 'deleted', id: string) => void>();
const { layout } = useHitsLayout();

function onDeleted(id: string) {
  emit('deleted', id);
}
</script>
