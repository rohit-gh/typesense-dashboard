<template>
  <q-page class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Collections</h1>
        <p class="page-lede">Schemas on this node, with document counts and field totals.</p>
      </div>
      <q-input
        v-model="state.filter"
        borderless
        debounce="300"
        class="page-filter"
        placeholder="Filter collections"
      >
        <template #append>
          <q-icon name="sym_s_search" />
        </template>
      </q-input>
    </header>

    <section class="composer">
      <collection-create></collection-create>
    </section>

    <section class="page-section">
      <q-table
        hide-pagination
        :filter="state.filter"
        :columns="state.columns"
        :rows="store.data.collections"
        row-key="name"
        :pagination="{ rowsPerPage: 0, sortBy: 'name' }"
      >
        <template #body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props">
              <q-btn no-caps flat :to="`/collection/${props.row.name}/search`">{{
                props.row.name
              }}</q-btn>
            </q-td>
            <q-td key="actions" :props="props">
              <q-btn flat round icon="sym_s_more_vert" aria-label="Collection actions">
                <q-menu>
                  <q-item dense clickable :to="`/collection/${props.row.name}/document`">
                    <q-item-section>Import documents</q-item-section>
                    <q-item-section avatar>
                      <q-avatar icon="sym_s_file_upload" />
                    </q-item-section>
                  </q-item>
                  <q-item dense clickable @click="exportCollection(props.row.name)">
                    <q-item-section>Export documents</q-item-section>
                    <q-item-section avatar>
                      <q-avatar icon="sym_s_file_download" />
                    </q-item-section>
                  </q-item>
                  <q-item dense clickable :to="`/collection/${props.row.name}/schema`">
                    <q-item-section>Edit schema</q-item-section>
                    <q-item-section avatar>
                      <q-avatar icon="sym_s_data_object" />
                    </q-item-section>
                  </q-item>
                  <q-item dense clickable @click="cloneCollection(props.row.name)">
                    <q-item-section>Clone schema</q-item-section>
                    <q-item-section avatar>
                      <q-avatar icon="sym_s_content_copy" />
                    </q-item-section>
                  </q-item>
                  <q-item dense clickable class="text-negative" @click="drop(props.row.name)">
                    <q-item-section>Delete collection</q-item-section>
                    <q-item-section avatar>
                      <q-avatar icon="sym_s_delete" />
                    </q-item-section>
                  </q-item>
                </q-menu>
              </q-btn>
            </q-td>
            <q-td key="num_documents" :props="props">
              <q-btn no-caps flat :to="`/collection/${props.row.name}/search`"
                >{{ props.row.num_documents }}
                <q-icon name="sym_s_search" size="1em" right />
              </q-btn>
            </q-td>
            <q-td key="schema_fields" :props="props">
              <q-btn no-caps flat :to="`/collection/${props.row.name}/schema`"
                >{{ props.row.fields.length || 0 }}
                <q-icon name="sym_s_data_object" size="1em" right />
              </q-btn>
            </q-td>
            <q-td key="created_at" :props="props">
              {{ new Date(props.row.created_at * 1000).toLocaleString() }}
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useNodeStore } from 'src/stores/node';
import CollectionCreate from 'src/components/collection/CollectionCreate.vue';

const $q = useQuasar();
const store = useNodeStore();

const state = reactive({
  filter: '',
  columns: [
    {
      name: 'name',
      required: true,
      label: 'Name',
      field: 'name',
      sortable: true,
    },
    {
      name: 'actions',
      required: false,
      label: '',
      field: 'actions',
      sortable: false,
    },
    {
      name: 'num_documents',
      required: true,
      label: 'Documents',
      field: 'num_documents',
      sortable: true,
    },
    {
      name: 'schema_fields',
      required: true,
      label: 'Fields',
      field: 'fields',
      sortable: true,
    },
    {
      name: 'created_at',
      required: true,
      label: 'Created',
      field: 'created_at',
      sortable: true,
    },
  ],
});

onMounted(() => {
  void store.getCollections();
});

async function exportCollection(collectionName: string) {
  $q.loading.show({
    message: 'Exporting documents…',
  });

  try {
    await store.exportDocuments(collectionName);
  } catch {
    $q.dialog({
      title: 'Export failed',
      message: 'Use the desktop app for large collections.',
    });
  } finally {
    $q.loading.hide();
  }
}

function drop(name: string) {
  $q.dialog({
    title: `Delete ${name}?`,
    message: `This deletes the collection and every document in it. It cannot be undone.`,
    cancel: { flat: true, label: 'Keep collection', color: 'primary' },
    ok: { unelevated: true, label: 'Delete collection', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void store.dropCollection(name);
  });
}

function cloneCollection(collectionName: string) {
  $q.dialog({
    title: 'Clone schema',
    message: 'Name the new collection. Schema, synonyms, and curations are copied; documents are not.',
    prompt: {
      model: '',
      type: 'text',
    },
    cancel: { flat: true, label: 'Cancel', color: 'primary' },
    ok: { unelevated: true, label: 'Clone schema', color: 'primary' },
    persistent: true,
  }).onOk((destinationName) => {
    void store.cloneCollectionSchema({
      collectionName,
      destinationName,
    });
  });
}
</script>
