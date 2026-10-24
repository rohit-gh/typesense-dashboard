<template>
  <q-page class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Stopwords</h1>
        <p class="page-lede">Words dropped from queries when a set is attached to a search.</p>
      </div>
      <q-input
        v-model="state.filter"
        borderless
        debounce="300"
        class="page-filter"
        placeholder="Filter sets"
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
        :label="isUpdate ? 'Update set' : 'New set'"
      >
        <div class="field-stack">
          <div class="field-grid">
            <label class="field">
              <span class="field-label">ID</span>
              <q-input
                v-model="state.stopwordsSet.id"
                borderless
                hide-bottom-space
                :rules="[(val) => !!val || 'Enter a set ID']"
              />
            </label>
            <label class="field">
              <span class="field-label">Locale</span>
              <q-input v-model="state.stopwordsSet.locale" borderless hide-bottom-space />
            </label>
          </div>
          <q-btn
            type="a"
            no-caps
            flat
            :href="`https://typesense.org/docs/${store.data.debug.version || store.data.defaultDocVersion}/api/stopwords.html`"
            target="_blank"
          >
            Stopword documentation
          </q-btn>
          <label class="field">
            <span class="field-label">Stopwords</span>
            <q-select
              v-model="state.stopwordsSet.stopwords"
              borderless
              multiple
              use-chips
              use-input
              new-value-mode="add"
              hide-dropdown-icon
              hide-bottom-space
            />
            <p class="field-hint">Type a word and press Enter.</p>
          </label>
        </div>
        <q-banner v-if="state.jsonError" inline-actions>
          This JSON is invalid: {{ state.jsonError }}
        </q-banner>
        <div class="form-actions form-actions--end">
          <q-btn
            unelevated
            color="primary"
            no-caps
            :disable="!!state.jsonError"
            @click="createStopwordsSet()"
            >{{ isUpdate ? 'Update set' : 'Add set' }}
          </q-btn>
        </div>
      </q-expansion-item>
    </section>

    <section class="page-section">
      <q-table
        wrap-cells
        :filter="state.filter"
        :rows="store.data.stopwords"
        :columns="state.columns"
        row-key="id"
        :visible-columns="visibleColumns"
        :rows-per-page-options="[50, 125, 250]"
        :pagination="{ rowsPerPage: 50 }"
      >
        <template #body-cell-stopwords="props">
          <q-td>
            <q-chip v-for="stopword in props.row.stopwords" :key="stopword">
              {{ stopword }}
            </q-chip>
          </q-td>
        </template>
        <template #body-cell-actions_op="props">
          <q-td>
            <div class="table-actions">
              <q-btn flat no-caps @click="editStopwordsSet(props.row)">Edit</q-btn>
              <q-btn
                flat
                no-caps
                class="table-action-danger"
                @click="deleteStopwordsSet(props.row.id)"
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
import { useVisibleColumns } from '../composables/useVisibleColumns';
import type { StopwordSchema } from 'typesense/lib/Typesense/Stopword';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();
const visibleColumns = useVisibleColumns(
  ['id', 'locale', 'stopwords', 'actions_op'],
  ['id', 'stopwords', 'actions_op'],
);

const state = reactive({
  jsonError: null as string | null,
  stopwordsSet: {
    id: 'stopword_set1',
    locale: 'en',
    stopwords: ['states', 'united', 'france', 'germany', 'italy'],
  },
  expanded: store.data.stopwords.length === 0,
  filter: '',
  columns: [
    {
      label: 'ID',
      name: 'id',
      field: 'id',
      sortable: true,
      align: 'left',
    },
    {
      label: 'Locale',
      name: 'locale',
      field: 'locale',
      sortable: true,
      align: 'left',
    },
    {
      label: 'Stopwords',
      name: 'stopwords',
      field: 'stopwords',
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

const isUpdate = computed(() =>
  store.data.stopwords.map((p: any) => p.id).includes(state.stopwordsSet.id),
);

async function createStopwordsSet() {
  await store.upsertStopwords(JSON.parse(JSON.stringify(state.stopwordsSet)));
}

function editStopwordsSet(stopwordsSet: StopwordSchema) {
  state.stopwordsSet = JSON.parse(JSON.stringify(stopwordsSet));
  state.expanded = true;
}

function deleteStopwordsSet(id: string) {
  $q.dialog({
    title: `Delete stopwords set ${id}?`,
    message: 'Searches that reference this set will stop dropping these words.',
    cancel: { flat: true, label: 'Keep set', color: 'primary' },
    ok: { unelevated: true, label: 'Delete set', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void store.deleteStopwords(id);
  });
}

onMounted(() => {
  void store.getStopwords();
});
</script>
