<template>
  <p v-if="!items.length" class="muted hits-ledger-empty">No documents matched this query.</p>
  <div v-else ref="scroller" class="hits-grid" tabindex="0" @keydown="onKeydown">
    <article
      v-for="item in items"
      :key="documentId(item)"
      class="hits-grid-item"
      :class="{ 'is-selected': selectedId === documentId(item) }"
      :aria-selected="selectedId === documentId(item)"
      @click="select(documentId(item))"
    >
      <dl class="hits-grid-fields">
        <div v-for="column in columns" :key="column.name" class="hits-grid-field">
          <dt :class="{ 'is-unknown': !column.known }">{{ column.name }}</dt>
          <dd>
            <search-hit-cell :item="item" :field="column" />
          </dd>
        </div>
      </dl>
      <search-hit-actions
        v-if="selectedId === documentId(item)"
        @edit="editSelected"
        @delete="deleteSelected"
        @close="close"
      />
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection';
import { useNodeStore } from '../../stores/node';
import SearchHitCell from './SearchHitCell.vue';
import SearchHitActions from './SearchHitActions.vue';
import { useHitActions } from './useHitActions';
import { documentId, hitColumns, type HitItem } from './hitValue';

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
