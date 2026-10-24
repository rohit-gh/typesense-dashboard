<template>
  <q-page class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Presets</h1>
        <p class="page-lede">Named search parameter sets that clients can reuse.</p>
      </div>
      <q-input
        v-model="state.filter"
        borderless
        debounce="300"
        class="page-filter"
        placeholder="Filter presets"
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
        :label="isUpdate ? 'Update preset' : 'New preset'"
      >
        <div class="composer-editor">
          <label class="field">
            <span class="field-label">Name</span>
            <q-input
              v-model="state.preset.name"
              borderless
              hide-bottom-space
              :rules="[(val) => !!val || 'Enter a preset name']"
            />
          </label>
          <q-btn
            type="a"
            no-caps
            flat
            :href="`https://typesense.org/docs/${store.data.debug.version || store.data.defaultDocVersion}/api/search.html#presets`"
            target="_blank"
            >Preset documentation</q-btn
          >
          <monaco-editor v-model="keyJson" class="editor-pane"></monaco-editor>
          <q-banner v-if="state.jsonError" inline-actions>
            This JSON is invalid: {{ state.jsonError }}
          </q-banner>
          <div class="form-actions form-actions--end">
            <q-btn
              unelevated
              color="primary"
              no-caps
              :disable="!!state.jsonError"
              @click="createSearchPreset()"
              >{{ isUpdate ? 'Update preset' : 'Add preset' }}</q-btn
            >
          </div>
        </div>
      </q-expansion-item>
    </section>

    <section class="page-section">
      <q-table
        :filter="state.filter"
        :rows="store.data.searchPresets"
        :columns="state.columns"
        row-key="id"
        :visible-columns="visibleColumns"
        :rows-per-page-options="[50, 125, 250]"
        :pagination="{ rowsPerPage: 50, sortBy: 'name' }"
      >
        <template #body-cell-actions_op="props">
          <q-td>
            <div class="table-actions">
              <q-btn flat no-caps @click="editSearchPreset(props.row)">Edit</q-btn>
              <q-btn
                flat
                no-caps
                class="table-action-danger"
                @click="deleteSearchPreset(props.row.name)"
              >Delete</q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import { computed, onMounted, reactive } from 'vue';
import { useQuasar } from 'quasar';
import MonacoEditor from '../components/MonacoEditor.vue';
import { useVisibleColumns } from '../composables/useVisibleColumns';
import type { PresetSchema } from 'typesense/lib/Typesense/Preset';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();
const visibleColumns = useVisibleColumns(['name', 'value', 'actions_op'], ['name', 'actions_op']);

const state = reactive({
  jsonError: null as string | null,
  preset: {
    name: '',
    value: {
      collection: 'products',
      q: '*',
      sort_by: 'popularity',
    },
  },
  expanded: store.data.searchPresets.length === 0,
  filter: '',
  columns: [
    {
      label: 'Name',
      name: 'name',
      field: 'name',
      sortable: true,
      align: 'left',
    },
    {
      label: 'Search Parameters',
      name: 'value',
      field: (row: PresetSchema) => JSON.stringify(row.value),
      sortable: true,
      align: 'left',
    },
    {
      label: '',
      name: 'actions_op',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const keyJson = computed({
  get: () => JSON.stringify(state.preset.value, null, 2),
  set: (json: string) => {
    try {
      state.preset.value = JSON.parse(json);
      state.jsonError = null;
    } catch (e) {
      state.jsonError = (e as Error).message;
    }
  },
});

const isUpdate = computed(() =>
  store.data.searchPresets.map((p: PresetSchema) => p.name).includes(state.preset.name),
);

async function createSearchPreset() {
  await store.upsertSearchPreset(JSON.parse(JSON.stringify(state.preset)));
}

function editSearchPreset(preset: PresetSchema) {
  state.preset = JSON.parse(JSON.stringify(preset));
  state.expanded = true;
}

function deleteSearchPreset(name: string) {
  $q.dialog({
    title: `Delete preset ${name}?`,
    message: 'Clients that reference this preset will stop receiving its parameters.',
    cancel: { flat: true, label: 'Keep preset', color: 'primary' },
    ok: { unelevated: true, label: 'Delete preset', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void store.deleteSearchPreset(name);
  });
}

onMounted(() => {
  void store.getSearchPresets();
});
</script>
