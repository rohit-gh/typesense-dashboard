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
        <div class="column" style="height: 60vh">
          <div class="row items-end q-col-gutter-md q-py-md">
            <q-input
              v-model="state.preset.name"
              class="col-12 col-sm-6"
              label="Name"
              borderless
              :rules="[(val) => !!val || 'Enter a preset name']"
            />
            <q-btn
              type="a"
              no-caps
              flat
              dense
              :href="`https://typesense.org/docs/${store.data.debug.version || store.data.defaultDocVersion}/api/search.html#presets`"
              target="_blank"
              >Preset documentation</q-btn
            >
          </div>
          <monaco-editor v-model="keyJson"></monaco-editor>
          <q-banner v-if="state.jsonError" inline-actions>
            This JSON is invalid: {{ state.jsonError }}
          </q-banner>
          <div class="row justify-end q-py-md">
            <q-btn
              unelevated
              color="primary"
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
      >
        <template #body-cell-actions_op="props">
          <q-td class="text-right">
            <q-btn
              flat
              icon="sym_s_edit"
              title="Edit preset"
              @click="editSearchPreset(props.row)"
            ></q-btn>
            <q-btn
              flat
              color="negative"
              icon="sym_s_delete_forever"
              title="Delete preset"
              @click="deleteSearchPreset(props.row.name)"
            ></q-btn>
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
import type { PresetSchema } from 'typesense/lib/Typesense/Preset';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();

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
