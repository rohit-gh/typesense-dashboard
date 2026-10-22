<template>
  <div class="hits-layout" role="radiogroup" aria-label="Hits layout" @keydown="onKeydown">
    <q-btn
      v-for="option in options"
      :key="option.value"
      :unelevated="layout === option.value"
      :flat="layout !== option.value"
      :color="layout === option.value ? 'primary' : undefined"
      dense
      no-caps
      :icon="option.icon"
      :aria-label="option.label"
      role="radio"
      :aria-checked="layout === option.value"
      :tabindex="layout === option.value ? 0 : -1"
      @click="layout = option.value"
    />
  </div>
</template>

<script setup lang="ts">
import { useHitsLayout, type HitsLayout } from './useHitsLayout';

const { layout } = useHitsLayout();

const options: { value: HitsLayout; label: string; icon: string }[] = [
  { value: 'table', label: 'Table', icon: 'sym_s_table_rows' },
  { value: 'grid', label: 'Grid', icon: 'sym_s_grid_view' },
];

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  event.preventDefault();
  layout.value = layout.value === 'table' ? 'grid' : 'table';
}
</script>
