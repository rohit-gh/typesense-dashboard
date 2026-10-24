<template>
  <q-page class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Curations</h1>
        <p class="page-lede">Pin, hide, or override results for a specific query.</p>
      </div>
      <q-input
        v-model="state.filter"
        borderless
        debounce="300"
        class="page-filter"
        placeholder="Filter curations"
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
        :label="isUpdate ? 'Update curation' : 'New curation'"
      >
        <div class="composer-editor">
          <label class="field">
            <span class="field-label">ID</span>
            <q-input v-model="state.id" borderless hide-bottom-space />
          </label>
          <monaco-editor v-model="overrideJson" class="editor-pane"></monaco-editor>
          <q-banner v-if="state.jsonError" inline-actions>
            This JSON is invalid: {{ state.jsonError }}
          </q-banner>
          <div class="form-actions form-actions--end">
            <q-btn unelevated color="primary" no-caps :disable="!isValid" @click="createOverride()">{{
              isUpdate ? 'Update curation' : 'Add curation'
            }}</q-btn>
          </div>
        </div>
      </q-expansion-item>
    </section>

    <section class="page-section">
      <q-table
        :filter="state.filter"
        :rows="store.data.overrides"
        :columns="state.columns"
        row-key="id"
        :visible-columns="visibleColumns"
        :rows-per-page-options="[50, 125, 250]"
        :pagination="{ rowsPerPage: 50, sortBy: 'id' }"
      >
        <template #body-cell-actions="props">
          <q-td>
            <div class="table-actions">
              <q-btn flat no-caps @click="editOverride(props.row)">Edit</q-btn>
              <q-btn
                flat
                no-caps
                class="table-action-danger"
                @click="deleteOverride(props.row.id)"
              >Delete</q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useVisibleColumns } from '../composables/useVisibleColumns';
import { nanoid } from 'nanoid';
import MonacoEditor from 'src/components/MonacoEditor.vue';
import { useNodeStore } from 'src/stores/node';
import type { OverrideSchema } from 'typesense/lib/Typesense/Override';
import type { OverrideCreateSchema } from 'typesense/lib/Typesense/Overrides';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();
const visibleColumns = useVisibleColumns(
  ['query', 'match', 'includes', 'excludes', 'actions'],
  ['query', 'match', 'actions'],
);

const initialData: OverrideCreateSchema = {
  rule: {
    query: 'apple',
    match: 'exact',
  },
  includes: [
    { id: '422', position: 1 },
    { id: '54', position: 2 },
  ],
  excludes: [{ id: '287' }],
};

const state = reactive({
  id: nanoid(),
  override: initialData as OverrideSchema | OverrideCreateSchema,
  jsonError: null as string | null,
  expanded: store.data.overrides.length === 0,
  filter: '',
  columns: [
    {
      label: 'ID',
      name: 'id',
      field: 'id',
    },
    {
      label: 'Query',
      name: 'query',
      field: (row: any) => row.rule.query,
      sortable: true,
      align: 'left',
    },
    {
      label: 'Match',
      name: 'match',
      field: (row: any) => row.rule.match,
      sortable: true,
      align: 'left',
    },
    {
      label: 'Includes',
      name: 'includes',
      field: (row: OverrideSchema) => row.includes?.length,
    },
    {
      label: 'Excludes',
      name: 'excludes',
      field: (row: OverrideSchema) => row.excludes?.length,
    },
    {
      label: '',
      name: 'actions',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const isValid = computed(() => state.id.length > 0 && !state.jsonError);
const isUpdate = computed(() => store.data.overrides.map((o) => o.id).includes(state.id));

const overrideJson = computed({
  get: () => JSON.stringify(state.override, null, 2),
  set: (json: string) => {
    try {
      state.override = JSON.parse(json);
      state.jsonError = null;
    } catch (e) {
      state.jsonError = (e as Error).message;
    }
  },
});

async function createOverride() {
  await store.createOverride({
    id: state.id,
    override: JSON.parse(JSON.stringify(state.override)),
  });
  state.id = nanoid();
  state.override = initialData;
  state.expanded = false;
}

function editOverride(override: OverrideSchema) {
  state.override = JSON.parse(JSON.stringify(override));
  state.id = override.id || nanoid();
  state.expanded = true;
}

function deleteOverride(id: string) {
  $q.dialog({
    title: `Delete curation ${id}?`,
    message: 'This query will go back to organic ranking.',
    cancel: { flat: true, label: 'Keep curation', color: 'primary' },
    ok: { unelevated: true, label: 'Delete curation', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void store.deleteOverride(id);
  });
}
</script>
