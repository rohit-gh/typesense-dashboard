<template>
  <div class="facet-field">
    <div class="text-subtitle2">{{ attribute }}</div>
    <ais-refinement-list
      class="facet-list"
      :attribute="attribute"
      :searchable="searchable"
      :show-more="true"
      :limit="10"
      :show-more-limit="40"
    >
      <template #noResults>
        <div class="ais-RefinementList-noResults">No matching values.</div>
      </template>
      <template #item="{ item, refine }">
        <label class="ais-RefinementList-label" :title="item.label">
          <input
            class="ais-RefinementList-checkbox"
            type="checkbox"
            :checked="item.isRefined"
            :value="item.value"
            @change="refine(item.value)"
          />
          <span class="ais-RefinementList-labelText">
            <ais-highlight v-if="searchable" attribute="item" :hit="item" />
            <template v-else>{{ item.label }}</template>
          </span>
          <span class="ais-RefinementList-count">{{ item.count }}</span>
        </label>
      </template>
    </ais-refinement-list>
  </div>
</template>

<script setup lang="ts">
import { AisHighlight, AisRefinementList } from 'vue-instantsearch/vue3/es';

defineProps<{
  attribute: string;
  searchable?: boolean;
}>();
</script>
