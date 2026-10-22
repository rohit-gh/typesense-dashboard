<template>
  <q-page class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">API keys</h1>
        <p class="page-lede">Create scoped keys. The full value is shown once, at creation.</p>
      </div>
      <q-input
        v-model="state.filter"
        borderless
        debounce="300"
        class="page-filter"
        placeholder="Filter keys"
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
        label="New API key"
      >
        <div class="column" style="height: 60vh">
          <div class="row q-gutter-sm q-py-md">
            <q-btn flat no-caps @click="loadAdminKey">Admin example</q-btn>
            <q-btn flat no-caps @click="loadSearchKey">Search example</q-btn>
            <q-btn
              type="a"
              no-caps
              flat
              dense
              :href="`https://typesense.org/docs/${store.data.debug.version || store.data.defaultDocVersion}/api/api-keys.html#create-an-api-key`"
              target="_blank"
              >Key documentation</q-btn
            >
          </div>
          <monaco-editor v-model="keyJson"></monaco-editor>
          <q-banner v-if="state.jsonError" inline-actions>
            This JSON is invalid: {{ state.jsonError }}
          </q-banner>
          <div class="row justify-end q-py-md">
            <q-btn unelevated color="primary" :disable="!!state.jsonError" @click="createApiKey">
              Create API key
            </q-btn>
          </div>
        </div>
      </q-expansion-item>
    </section>

    <section class="page-section">
      <q-table
        :filter="state.filter"
        :rows="store.data.apiKeys"
        :columns="state.columns"
        row-key="id"
        :visible-columns="[
          'id',
          'value_prefix',
          'description',
          'actions',
          'collections',
          'expires_at',
          'actions_op',
        ]"
      >
        <template #body-cell-actions_op="props">
          <q-td class="text-right">
            <q-btn
              flat
              color="negative"
              icon="sym_s_delete_forever"
              title="Delete API key"
              @click="deleteApiKey(props.row.id)"
            ></q-btn>
          </q-td>
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useNodeStore } from 'src/stores/node';
import MonacoEditor from '../components/MonacoEditor.vue';
import type { KeyCreateSchema } from 'typesense/lib/Typesense/Key';
import type { QTableProps } from 'quasar';

const $q = useQuasar();
const store = useNodeStore();

const adminKeyExample: KeyCreateSchema = {
  description: 'Admin key.',
  actions: ['*'],
  collections: ['*'],
};

const searchKeyExample: KeyCreateSchema = {
  description: 'Search-only companies key.',
  actions: ['documents:search'],
  collections: ['companies'],
};

const state = reactive({
  jsonError: null as string | null,
  key: JSON.parse(JSON.stringify(adminKeyExample)) as KeyCreateSchema,
  expanded: store.data.apiKeys.length === 0,
  filter: '',
  columns: [
    {
      label: 'ID',
      name: 'id',
      field: 'id',
      sortable: true,
    },
    {
      label: 'Prefix',
      name: 'value_prefix',
      field: 'value_prefix',
    },
    {
      label: 'Description',
      name: 'description',
      field: 'description',
      sortable: true,
      align: 'left',
    },
    {
      label: 'Permissions',
      name: 'actions',
      field: (row: KeyCreateSchema) => JSON.stringify(row.actions),
      sortable: true,
      align: 'left',
    },
    {
      label: 'Collections',
      name: 'collections',
      field: (row: KeyCreateSchema) => JSON.stringify(row.collections),
      sortable: true,
      align: 'left',
    },
    {
      label: 'Expires',
      name: 'expires_at',
      field: (row: KeyCreateSchema) =>
        row.expires_at
          ? row.expires_at === 64723363199
            ? 'never'
            : new Date(row.expires_at * 1000).toLocaleString()
          : '',
    },
    {
      label: '',
      name: 'actions_op',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const keyJson = computed({
  get: () => JSON.stringify(state.key, null, 2),
  set: (json: string) => {
    try {
      state.key = JSON.parse(json);
      state.jsonError = null;
    } catch (e) {
      state.jsonError = (e as Error).message;
    }
  },
});

function loadAdminKey() {
  state.key = JSON.parse(JSON.stringify(adminKeyExample));
}

function loadSearchKey() {
  state.key = JSON.parse(JSON.stringify(searchKeyExample));
}

async function createApiKey() {
  const key = await store.createApiKey(JSON.parse(JSON.stringify(state.key)));
  $q.dialog({
    title: 'Copy this API key now',
    message: `Typesense will not show the full value again.\n\n${key.value || ''}`,
    cancel: false,
    persistent: true,
    ok: { unelevated: true, label: 'I have copied it', color: 'primary' },
  });
}

function deleteApiKey(id: string) {
  $q.dialog({
    title: `Delete API key ${id}?`,
    message: 'Clients using this key will lose access immediately.',
    cancel: { flat: true, label: 'Keep key', color: 'primary' },
    ok: { unelevated: true, label: 'Delete key', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void store.deleteApiKey(id);
  });
}
</script>
