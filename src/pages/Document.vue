<template>
  <q-page class="page column">
    <header class="page-head">
      <div>
        <h1 class="page-title">Add documents</h1>
        <p class="page-lede">
          Import JSON into {{ store.currentCollection?.name || 'this collection' }}.
        </p>
      </div>
      <q-btn
        unelevated
        :disable="!$q.platform.is.electron"
        icon="sym_s_attach_file"
        @click="importFile()"
      >
        {{ $q.platform.is.electron ? 'Import from file' : 'Import from file (desktop app)' }}
      </q-btn>
    </header>

    <monaco-editor v-model="documentsJson" style="min-height: 200px"></monaco-editor>
    <q-banner v-if="state.jsonError" inline-actions>
      This JSON is invalid: {{ state.jsonError }}
    </q-banner>

    <div class="row items-end justify-between q-col-gutter-md q-my-md">
      <q-btn unelevated color="primary" @click="addEmptyDocument()">Add empty document</q-btn>
      <div class="row col-auto items-end q-gutter-md">
        <q-select
          v-model="state.action"
          borderless
          label="Import mode"
          style="width: 18rem"
          :options="actionOptions"
          :hint="actionDescriptions[state.action]"
        />
        <q-btn unelevated color="primary" :disable="!!state.jsonError" @click="importDocuments()"
          >Import documents</q-btn
        >
      </div>
    </div>

    <div>
      <q-banner
        v-for="(result, index) in state.results"
        :key="index"
        :class="{ 'bg-green': result.success, 'bg-red': result.error }"
      >
        {{ index }}:
        <span v-if="result.success">{{ result.success }}</span>
        <span v-else>{{ result.error }}</span>
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import MonacoEditor from 'src/components/MonacoEditor.vue';
import { computed, reactive, watch } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();

const state = reactive({
  jsonError: null as string | null,
  documents: [] as any[],
  results: [] as any[],
  action: 'upsert' as 'create' | 'upsert' | 'update',
});

const actionOptions = ['create', 'upsert', 'update'];
const actionDescriptions = {
  create: 'Create a document. Fails if the id already exists.',
  upsert: 'Create the document, or replace it if the id exists.',
  update: 'Update an existing document. Partial documents are allowed.',
};

const documentsJson = computed({
  get: () => JSON.stringify(state.documents, null, 2),
  set: (json: string) => {
    try {
      state.documents = JSON.parse(json);
      state.jsonError = null;
    } catch (e) {
      state.jsonError = (e as Error).message;
    }
  },
});

watch(
  () => store.currentCollection,
  () => {
    state.documents = [];
    addEmptyDocument();
  },
  { immediate: true },
);

watch(
  () => store.documentsToEdit,
  () => {
    if (store.documentsToEdit && store.documentsToEdit.length > 0) {
      state.documents = store.documentsToEdit || [];
      state.action = 'upsert';
      store.setDocumentsToEdit([]);
    }
  },
  { immediate: true },
);

async function importFile() {
  state.results = [];
  try {
    $q.loading.show({
    message: 'Importing documents…',
    });
    // @ts-expect-error electron only
    let results = await store.api?.importFile(store.currentCollection?.name, state.action);
    if (!Array.isArray(results)) {
      results = [{ error: results }];
    }
    state.results = results;
  } catch (error) {
    state.results = [{ error: (error as Error).message }];
  }
  $q.loading.hide();
}

async function importDocuments() {
  state.results = [];
  try {
    $q.loading.show({
    message: 'Importing documents…',
    });
    state.results = await store.importDocuments({
      action: state.action,
      documents: JSON.parse(JSON.stringify(state.documents)),
    });
  } catch (error) {
    state.results = [{ error: (error as Error).message }];
  }
  $q.loading.hide();
}

function addEmptyDocument() {
  let document = {};
  if (store.currentCollection && store.currentCollection.fields) {
    document = store.currentCollection.fields.reduce((obj: any, field): any => {
      obj[field.name] = field.type.includes('[]')
        ? []
        : field.type.includes('string')
          ? ''
          : field.type.includes('bool')
            ? false
            : 0;
      return obj;
    }, {});
  }
  state.documents.push(document);
}
</script>
