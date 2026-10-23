<template>
  <q-page class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Synonyms</h1>
        <p class="page-lede">Treat related terms as the same query in this collection.</p>
      </div>
      <q-input
        v-model="state.filter"
        borderless
        debounce="300"
        class="page-filter"
        placeholder="Filter synonyms"
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
        :label="isUpdate ? 'Update synonym' : 'New synonym'"
      >
        <div class="field-stack q-py-md">
          <q-input v-model="state.id" label="ID" borderless />
          <q-option-group v-model="state.type" :options="typeOptions" color="primary" inline />
          <q-input
            v-if="state.type === types.ONE_WAY"
            v-model="state.synonym.root"
            borderless
            stack-label
            label="Root"
          />
          <q-select
            v-model="state.synonym.synonyms"
            borderless
            multiple
            use-chips
            use-input
            new-value-mode="add"
            stack-label
            hide-dropdown-icon
            label="Synonyms"
            hint="Type a term and press Enter"
          />
          <h3 class="page-section-title">Optional</h3>
          <q-select
            v-model="state.synonym.symbols_to_index"
            borderless
            multiple
            use-chips
            use-input
            new-value-mode="add"
            stack-label
            hide-dropdown-icon
            label="Symbols to index"
            hint="Type a symbol such as + or − and press Enter"
          />
          <q-input
            v-model="state.synonym.locale"
            borderless
            stack-label
            label="Locale"
            hint="Leave blank to auto-detect"
          />
          <div class="form-actions form-actions--end">
            <q-btn unelevated color="primary" :disable="!isValid" @click="createSynonym()">{{
              isUpdate ? 'Update synonym' : 'Add synonym'
            }}</q-btn>
          </div>
        </div>
      </q-expansion-item>
    </section>

    <section class="page-section">
      <q-table
        :filter="state.filter"
        :rows="store.data.synonyms"
        :columns="state.columns"
        row-key="id"
        :visible-columns="visibleColumns"
        :pagination="{ rowsPerPage: 50, sortBy: 'name' }"
      >
        <template #body-cell-actions="props">
          <q-td class="text-right">
            <q-btn
              flat
              icon="sym_s_edit"
              title="Edit synonym"
              @click="editSynonym(props.row)"
            ></q-btn>
            <q-btn
              flat
              color="negative"
              icon="sym_s_delete_forever"
              title="Delete synonym"
              @click="deleteSynonym(props.row.id)"
            ></q-btn>
          </q-td>
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import { computed, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useVisibleColumns } from '../composables/useVisibleColumns';
import { nanoid } from 'nanoid';
import type { SynonymCreateSchema } from 'typesense/lib/Typesense/Synonyms';
import type { SynonymSchema } from 'typesense/lib/Typesense/Synonym';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();
const visibleColumns = useVisibleColumns(
  ['id', 'type', 'root', 'synonyms', 'symbols_to_index', 'locale', 'actions'],
  ['id', 'synonyms', 'actions'],
);

enum RootTypes {
  ONE_WAY = 'one-way',
  MULTI_WAY = 'multi-way',
}

const types = RootTypes;

const typeOptions = [
  {
    label: 'Multi-way synonyms',
    value: RootTypes.MULTI_WAY,
  },
  {
    label: 'One-way synonym',
    value: RootTypes.ONE_WAY,
  },
];

const state = reactive({
  expanded: store.data.synonyms.length === 0,
  filter: '',
  type: RootTypes.MULTI_WAY,
  synonym: {
    root: '',
    synonyms: [],
    locale: '',
    symbols_to_index: [],
  } as SynonymCreateSchema,
  id: nanoid(),
  columns: [
    {
      label: 'ID',
      name: 'id',
      field: 'id',
      align: 'left',
    },
    {
      label: 'Type',
      name: 'type',
      align: 'left',
      field: (row: SynonymSchema) => (row.root ? RootTypes.ONE_WAY : RootTypes.MULTI_WAY),
      sortable: true,
    },
    {
      label: 'Root',
      name: 'root',
      field: 'root',
      align: 'left',
      sortable: true,
    },
    {
      label: 'Synonyms',
      name: 'synonyms',
      field: (row: SynonymSchema) => row.synonyms.join(', '),
      align: 'left',
      sortable: true,
    },
    {
      label: 'Symbols to Index',
      name: 'symbols_to_index',
      field: (row: SynonymSchema) => row.symbols_to_index?.join(', '),
      align: 'left',
      sortable: true,
    },
    {
      label: 'Locale',
      name: 'locale',
      field: 'locale',
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

const isValid = computed(() => state.synonym.synonyms.length > 0 && state.id.length > 0);
const isUpdate = computed(() => store.data.synonyms.map((s) => s.id).includes(state.id));

async function createSynonym() {
  const synonym: SynonymCreateSchema = {
    synonyms: JSON.parse(JSON.stringify(state.synonym.synonyms)),
  };

  if (state.type === types.ONE_WAY) {
    synonym.root = state.synonym.root || '';
  }
  if (state.synonym.locale) {
    synonym.locale = state.synonym.locale;
  }
  if (state.synonym.symbols_to_index && state.synonym.symbols_to_index.length > 0) {
    synonym.symbols_to_index = state.synonym.symbols_to_index;
  }

  await store.createSynonym({
    id: state.id,
    synonym: synonym,
  });

  state.id = nanoid();
  state.synonym = {
    root: '',
    synonyms: [],
    locale: '',
    symbols_to_index: [],
  };
  state.expanded = false;
}

function editSynonym(synonym: SynonymSchema) {
  state.id = synonym.id || nanoid();
  state.synonym = JSON.parse(JSON.stringify(synonym));
  state.type = state.synonym.root ? RootTypes.ONE_WAY : RootTypes.MULTI_WAY;
  state.synonym.locale = state.synonym.locale || '';
  state.synonym.symbols_to_index = state.synonym.symbols_to_index || [];
  state.expanded = true;
}

function deleteSynonym(id: string) {
  $q.dialog({
    title: `Delete synonym ${id}?`,
    message: 'Queries will stop treating these terms as equivalent.',
    cancel: { flat: true, label: 'Keep synonym', color: 'primary' },
    ok: { unelevated: true, label: 'Delete synonym', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void store.deleteSynonym(id);
  });
}
</script>
