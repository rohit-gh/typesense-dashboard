<template>
  <p v-if="!items.length" class="muted hits-ledger-empty">No documents matched this query.</p>
  <div v-else ref="scroller" class="hits-ledger-scroller" tabindex="0" @keydown="onKeydown">
    <table class="hits-ledger" aria-label="Search hits">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.name"
            :class="{
              'is-num': isNumericType(column.type),
              'is-unknown': !column.known,
            }"
            :scope="'col'"
          >
            {{ column.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-for="item in items" :key="documentId(item)">
          <tr
            :class="{ 'is-selected': selectedId === documentId(item) }"
            :aria-selected="selectedId === documentId(item)"
            @click="select(documentId(item))"
          >
            <td
              v-for="column in columns"
              :key="column.name"
              :class="{ 'is-num': isNumericType(column.type), 'is-id': column.name === 'id' }"
            >
              <search-hit-cell :item="item" :field="column" />
            </td>
          </tr>
          <tr v-if="selectedId === documentId(item)" class="hits-ledger-actions">
            <td :colspan="columns.length">
              <search-hit-actions
                @edit="editSelected"
                @delete="deleteSelected"
                @close="close"
              />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection';
import { useNodeStore } from '../../stores/node';
import SearchHitCell from './SearchHitCell.vue';
import SearchHitActions from './SearchHitActions.vue';
import { useHitActions } from './useHitActions';
import { documentId, hitColumns, isNumericType, type HitItem } from './hitValue';

const props = defineProps<{
  items: HitItem[];
}>();
const emit = defineEmits<(e: 'deleted', id: string) => void>();

const store = useNodeStore();
const scroller = ref<HTMLElement | null>(null);
const { selectedId, select, close, onKeydown, editSelected, deleteSelected } = useHitActions(
  () => props.items,
  emit,
  scroller,
);

const currentCollection = computed((): CollectionSchema | null => store.currentCollection);
const columns = computed(() => hitColumns(currentCollection.value?.fields, props.items));
</script>
