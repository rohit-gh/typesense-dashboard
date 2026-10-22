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
              <div class="hits-ledger-actions-bar">
                <q-btn unelevated color="primary" no-caps @click.stop="editSelected"
                  >Edit document</q-btn
                >
                <q-btn flat no-caps class="hits-ledger-delete" @click.stop="deleteSelected"
                  >Delete document</q-btn
                >
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection';
import { useNodeStore } from '../../stores/node';
import SearchHitCell from './SearchHitCell.vue';
import {
  copyForEdit,
  documentId,
  isHiddenKey,
  isNumericType,
  type FieldInfo,
  type HitItem,
} from './hitValue';

const props = defineProps<{
  items: HitItem[];
}>();
const emit = defineEmits<(e: 'deleted', id: string) => void>();

const store = useNodeStore();
const $q = useQuasar();
const scroller = ref<HTMLElement | null>(null);
const selectedId = ref<string | null>(null);

const currentCollection = computed((): CollectionSchema | null => store.currentCollection);

const columns = computed((): FieldInfo[] => {
  const schemaFields = (currentCollection.value?.fields || []).filter(
    (field) => field.name && !field.name.includes('.*'),
  );
  const ordered: FieldInfo[] = [{ name: 'id', type: 'string', known: true }];
  schemaFields.forEach((field) => {
    if (field.name === 'id') return;
    const column: FieldInfo = {
      name: field.name,
      type: field.type,
      known: true,
    };
    if (field.embed) column.embed = field.embed;
    if (typeof field.num_dim === 'number') column.num_dim = field.num_dim;
    ordered.push(column);
  });
  const seen = new Set(ordered.map((column) => column.name));
  const extras = new Set<string>();
  props.items.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (!isHiddenKey(key) && !seen.has(key)) extras.add(key);
    });
  });
  extras.forEach((name) => {
    ordered.push({
      name,
      type: inferType(props.items, name),
      known: false,
    });
  });
  return ordered;
});

watch(
  () => props.items.map((item) => documentId(item)),
  (ids) => {
    if (selectedId.value && !ids.includes(selectedId.value)) {
      selectedId.value = null;
    }
  },
);

const selectedItem = computed(
  () => props.items.find((item) => documentId(item) === selectedId.value) || null,
);

function select(id: string) {
  selectedId.value = id;
  scroller.value?.focus({ preventScroll: true });
  void nextTick(() => {
    const row = scroller.value?.querySelector('tr.is-selected');
    row?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}

function move(delta: number) {
  if (!props.items.length) return;
  const ids = props.items.map((item) => documentId(item));
  const current = selectedId.value ? ids.indexOf(selectedId.value) : -1;
  const next = current === -1 ? (delta > 0 ? 0 : ids.length - 1) : current + delta;
  const id = ids[next];
  if (!id) return;
  select(id);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    move(1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    move(-1);
  } else if (event.key === 'Home') {
    event.preventDefault();
    const first = props.items[0];
    if (first) select(documentId(first));
  } else if (event.key === 'End') {
    event.preventDefault();
    const last = props.items[props.items.length - 1];
    if (last) select(documentId(last));
  } else if (event.key === 'Enter') {
    event.preventDefault();
    editSelected();
  } else if (event.key === 'Escape') {
    selectedId.value = null;
  }
}

function editSelected() {
  if (!selectedItem.value) return;
  void store.editDocuments([copyForEdit(selectedItem.value)]);
}

function deleteSelected() {
  const item = selectedItem.value;
  if (!item) return;
  const id = documentId(item);
  $q.dialog({
    title: `Delete document ${id}?`,
    message: 'This document will be removed from the collection.',
    cancel: { flat: true, label: 'Keep document', color: 'primary' },
    ok: { unelevated: true, label: 'Delete document', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    store
      .deleteDocumentById(id)
      ?.then(() => {
        selectedId.value = null;
        emit('deleted', id);
      })
      .catch((error: Error) => {
        $q.notify({
          type: 'negative',
          message: `Error deleting document: ${error.message}`,
        });
      });
  });
}

function inferType(items: HitItem[], name: string): string {
  const sample = items.find((item) => item[name] != null)?.[name];
  if (typeof sample === 'boolean') return 'bool';
  if (typeof sample === 'number') return Number.isInteger(sample) ? 'int64' : 'float';
  if (Array.isArray(sample)) {
    if (sample.every((entry) => typeof entry === 'number')) return 'float[]';
    if (sample.every((entry) => typeof entry === 'string')) return 'string[]';
    return 'object[]';
  }
  if (sample && typeof sample === 'object') return 'object';
  return 'string';
}
</script>
