<template>
  <q-page class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Analytics</h1>
        <p class="page-lede">Rules that capture popular, no-hit, and counter queries.</p>
      </div>
      <q-input
        v-model="state.filter"
        borderless
        debounce="300"
        class="page-filter"
        placeholder="Filter rules"
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
        :label="isUpdate ? 'Update rule' : 'New rule'"
      >
        <q-tabs v-model="tab" dense align="left" narrow-indicator>
          <q-tab name="form" label="Form" />
          <q-tab name="json" label="JSON" />
        </q-tabs>
        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="form" class="q-px-none">
            <div class="row q-col-gutter-md">
              <q-input
                v-model="state.rule.name"
                class="col-12 col-sm-6"
                label="Rule name"
                borderless
                :rules="[(val) => !!val || 'Enter a rule name']"
              />
              <q-select
                v-model="state.rule.type"
                :options="typeOptions"
                class="col-12 col-sm-6"
                label="Rule type"
                borderless
                :rules="[(val) => !!val || 'Choose a rule type']"
              />
              <q-select
                v-model="state.rule.params.source.collections"
                class="col-12 col-sm-6"
                label="Source collections"
                borderless
                :options="sourceOptions"
                multiple
                hint="Track searches sent to these collections or aliases"
              />
              <q-select
                v-model="state.rule.params.destination.collection"
                class="col-12 col-sm-6"
                label="Destination collection"
                borderless
                :options="sourceOptions"
              />
              <q-input
                v-model="state.rule.params.limit"
                class="col-12 col-sm-6"
                label="Limit"
                borderless
                type="number"
                min="0"
              />
              <q-checkbox
                v-model="state.rule.params.expand_query"
                class="col-12 col-sm-6"
                label="Expand query"
              />
            </div>
          </q-tab-panel>
          <q-tab-panel name="json" class="q-pa-none">
            <monaco-editor v-model="ruleJson" style="height: 60vh"></monaco-editor>
            <q-banner v-if="jsonError" inline-actions>
              This JSON is invalid: {{ jsonError }}
            </q-banner>
          </q-tab-panel>
        </q-tab-panels>
        <div class="row justify-end q-py-md">
          <q-btn unelevated color="primary" @click="createRule()">
            {{ isUpdate ? 'Update rule' : 'Add rule' }}
          </q-btn>
        </div>
      </q-expansion-item>
    </section>

    <section class="page-section">
      <q-table
        :filter="state.filter"
        :rows="store.data.analyticsRules"
        :columns="state.columns"
        row-key="name"
        :pagination="{ rowsPerPage: 50, sortBy: 'name' }"
      >
        <template #body-cell-actions="props">
          <q-td class="text-right">
            <q-btn flat icon="sym_s_edit" title="Edit rule" @click="editRule(props.row)"></q-btn>
            <q-btn
              flat
              color="negative"
              icon="sym_s_delete_forever"
              title="Delete rule"
              @click="deleteRule(props.row.name)"
            ></q-btn>
          </q-td>
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import type { AnalyticsRuleSchema } from 'typesense/lib/Typesense/AnalyticsRule';
import { computed, onMounted, reactive, ref } from 'vue';
import type { QTableProps } from 'quasar';
import { useQuasar } from 'quasar';
import MonacoEditor from 'src/components/MonacoEditor.vue';

const $q = useQuasar();
const store = useNodeStore();

function initialData(): AnalyticsRuleSchema {
  return {
    name: '',
    type: 'popular_queries',
    params: {
      source: {
        collections: [],
      },
      destination: {
        collection: '',
      },
      expand_query: false,
      limit: 100,
    },
  };
}

const state = reactive({
  rule: initialData(),
  expanded: store.data.analyticsRules.length === 0,
  filter: '',
  columns: [
    {
      label: 'Name',
      name: 'name',
      field: 'name',
      align: 'left',
      sortable: true,
    },
    {
      label: 'Type',
      name: 'type',
      field: 'type',
      align: 'left',
      sortable: true,
    },
    {
      label: 'Source',
      name: 'source',
      field: (r: AnalyticsRuleSchema) => r.params.source.collections.join(', '),
      align: 'left',
      sortable: true,
    },
    {
      label: 'Destination',
      name: 'destination',
      field: (r: AnalyticsRuleSchema) => r.params.destination.collection,
      align: 'left',
      sortable: true,
    },
    {
      label: 'Limit',
      name: 'limit',
      field: (r: AnalyticsRuleSchema) => r.params.limit,
      align: 'right',
      sortable: true,
    },
    {
      label: '',
      name: 'actions',
      align: 'right',
    },
  ] as QTableProps['columns'],
});

const collectionNames = computed(() => store.data.collections.map((collection) => collection.name));
const aliasNames = computed(() => store.data.aliases.map((alias) => alias.name));
// Combine and sort collections and aliases for dropdowns
const sourceOptions = computed(() => {
  const options = [...collectionNames.value, ...aliasNames.value];
  return options.sort();
});

const typeOptions = ref(['popular_queries', 'nohits_queries', 'counter']);

const isUpdate = computed(() =>
  store.data.analyticsRules.map((a) => a.name).includes(state.rule.name),
);

const tab = ref('form');
const ruleJson = computed({
  get() {
    return JSON.stringify(state.rule, null, 2);
  },
  set(json: string) {
    try {
      state.rule = JSON.parse(json);
      jsonError.value = null;
    } catch (e) {
      jsonError.value = (e as Error).message;
    }
  },
});
const jsonError = ref<string | null>(null);

async function createRule() {
  await store.createAnalyticsRule(state.rule);
  state.expanded = false;
  state.rule = initialData();
}

function editRule(rule: AnalyticsRuleSchema) {
  state.rule = JSON.parse(JSON.stringify(rule));
  state.expanded = true;
}

function deleteRule(name: string) {
  $q.dialog({
    title: `Delete rule ${name}?`,
    message: 'This stops capturing queries for this rule.',
    cancel: { flat: true, label: 'Keep rule', color: 'primary' },
    ok: { unelevated: true, label: 'Delete rule', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void store.deleteAnalyticsRule(name);
  });
}

onMounted(() => {
  void store.getAnalyticsRules();
});
</script>
