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
        <div class="row q-col-gutter-md q-py-md">
          <q-input
            v-model="state.stopwordsSet.id"
            class="col-12 col-sm-6"
            label="ID"
            borderless
            :rules="[(val) => !!val || 'Enter a set ID']"
          />
          <q-input
            v-model="state.stopwordsSet.locale"
            borderless
            label="Locale"
            class="col-12 col-sm-4"
          />
          <q-btn
            type="a"
            no-caps
            flat
            dense
            class="col-auto"
            :href="`https://typesense.org/docs/${store.data.debug.version || store.data.defaultDocVersion}/api/stopwords.html`"
            target="_blank"
          >
            Stopword documentation
          </q-btn>
          <q-select
            v-model="state.stopwordsSet.stopwords"
            class="col-12"
            borderless
            multiple
            use-chips
            use-input
            new-value-mode="add"
            stack-label
            hide-dropdown-icon
            label="Stopwords"
            hint="Type a word and press Enter"
          />
        </div>
        <q-banner v-if="state.jsonError" inline-actions>
          This JSON is invalid: {{ state.jsonError }}
        </q-banner>
        <div class="row justify-end q-py-md">
          <q-btn
            unelevated
            color="primary"
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
      >
        <template #body-cell-stopwords="props">
          <q-td>
            <q-chip v-for="stopword in props.row.stopwords" :key="stopword">
              {{ stopword }}
            </q-chip>
          </q-td>
        </template>
        <template #body-cell-actions_op="props">
          <q-td class="text-right text-no-wrap">
            <q-btn
              flat
              icon="sym_s_edit"
              title="Edit set"
              @click="editStopwordsSet(props.row)"
            ></q-btn>
            <q-btn
              flat
              color="negative"
              icon="sym_s_delete_forever"
              title="Delete set"
              @click="deleteStopwordsSet(props.row.id)"
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
import type { StopwordSchema } from 'typesense/lib/Typesense/Stopword';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();

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
