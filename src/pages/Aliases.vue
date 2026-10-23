<template>
  <q-page class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Aliases</h1>
        <p class="page-lede">Point a stable name at a collection so clients can switch indexes.</p>
      </div>
      <q-input
        v-model="state.filter"
        borderless
        debounce="300"
        class="page-filter"
        placeholder="Filter aliases"
      >
        <template #append>
          <q-icon name="sym_s_search" />
        </template>
      </q-input>
    </header>

    <section class="composer">
      <q-expansion-item
        v-model="state.expanded"
        expand-separator
        icon="sym_s_add_circle"
        expand-icon="sym_s_unfold_more"
        expanded-icon="sym_s_unfold_less"
        :label="isUpdate ? 'Update alias' : 'New alias'"
      >
        <div class="field-stack q-py-md">
          <q-input
            v-model="state.alias.name"
            label="Alias name"
            borderless
            :rules="[(name) => !collectionNames.includes(name) || 'Choose a name that is not a collection']"
          />
          <q-select
            v-model="state.alias.collection_name"
            label="Target collection"
            borderless
            :options="collectionNames"
          />
          <div class="form-actions form-actions--end">
            <q-btn unelevated color="primary" @click="createAlias()">
              {{ isUpdate ? 'Update alias' : 'Add alias' }}
            </q-btn>
          </div>
        </div>
      </q-expansion-item>
    </section>

    <section class="page-section">
      <q-table
        :filter="state.filter"
        :rows="store.data.aliases"
        :columns="state.columns"
        row-key="name"
        :visible-columns="visibleColumns"
        :pagination="{ rowsPerPage: 50, sortBy: 'name' }"
      >
        <template #body-cell-actions="props">
          <q-td class="text-right">
            <q-btn flat icon="sym_s_edit" title="Edit alias" @click="editAlias(props.row)"></q-btn>
            <q-btn
              flat
              color="negative"
              icon="sym_s_delete_forever"
              title="Delete alias"
              @click="deleteAlias(props.row.name)"
            ></q-btn>
          </q-td>
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useNodeStore } from 'src/stores/node';
import { useQuasar } from 'quasar';
import { useVisibleColumns } from '../composables/useVisibleColumns';
import type { CollectionAliasSchema } from 'typesense/lib/Typesense/Aliases';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();
const visibleColumns = useVisibleColumns(
  ['name', 'collection_name', 'actions'],
  ['name', 'collection_name', 'actions'],
);

const state = reactive({
  alias: { name: '', collection_name: '' },
  expanded: store.data.aliases.length === 0,
  filter: '',
  columns: [
    {
      label: 'Alias',
      name: 'name',
      field: 'name',
      align: 'left',
      sortable: true,
    },
    {
      label: 'Collection',
      name: 'collection_name',
      field: 'collection_name',
      align: 'left',
      sortable: true,
    },
    {
      label: '',
      name: 'actions',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const collectionNames = computed(() =>
  store.data.collections.map((collection) => collection.name).sort(),
);
const isUpdate = computed(() => store.data.aliases.map((a) => a.name).includes(state.alias.name));
async function createAlias() {
  await store.createAlias({
    name: state.alias.name,
    collection_name: state.alias.collection_name,
  });
  state.alias = { name: '', collection_name: '' };
  state.expanded = false;
}

function editAlias(alias: CollectionAliasSchema) {
  state.alias = JSON.parse(JSON.stringify(alias));
  state.expanded = true;
}

function deleteAlias(name: string) {
  $q.dialog({
    title: `Delete alias ${name}?`,
    message: 'Clients using this alias will stop resolving until you create it again.',
    cancel: { flat: true, label: 'Keep alias', color: 'primary' },
    ok: { unelevated: true, label: 'Delete alias', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void store.deleteAlias(name);
  });
}
</script>
