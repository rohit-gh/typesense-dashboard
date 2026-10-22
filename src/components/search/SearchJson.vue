<template>
  <div class="row">
    <div class="col-9">
      <monaco-editor
        v-model="searchParametersJson"
        style="height: 30vh; min-height: 200px"
      ></monaco-editor>
    </div>
    <div class="col-3">
      <q-scroll-area style="height: 100%">
        <q-list bordered separator dense>
          <q-item-label header>Recent queries</q-item-label>
          <q-item
            v-for="h in history"
            :key="h"
            v-ripple
            clickable
            :title="h"
            @click="searchParametersJson = h"
          >
            <q-item-section>
              {{ h.slice(0, 60) }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </div>
  </div>
  <q-banner v-if="jsonError" inline-actions class="text-white bg-red">
    Invalid Format: {{ jsonError }}
  </q-banner>
  <div class="q-mt-md">
    <q-btn
      size="md"
      padding="sm lg"
      unelevated
      color="primary"
      :disable="!!jsonError"
      @click="search()"
      >Run query</q-btn
    >
    <q-btn
      size="md"
      padding="sm lg"
      unelevated
      color="accent"
      class="q-ml-sm"
      :disable="!results || !results.hits"
      @click="exportHits()"
      >Export hits</q-btn
    >
    <q-btn
      size="md"
      padding="sm lg"
      unelevated
      color="accent"
      class="q-ml-sm"
      :disable="!results"
      @click="exportResults()"
      >Export raw results</q-btn
    >
  </div>
  <div v-if="results && results.hits" class="search-hits-json">
    <div class="search-hits-bar">
      <search-hits-layout-switch />
    </div>
    <search-hits-results :items="hits" @deleted="removeHit" />
  </div>
  <pre v-if="results && !results.hits">
          {{ resultsJson }}
        </pre
  >
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { LocalStorage } from 'quasar';
import { useNodeStore } from 'src/stores/node';
import MonacoEditor from 'src/components/MonacoEditor.vue';
import SearchHitsLayoutSwitch from './SearchHitsLayoutSwitch.vue';
import SearchHitsResults from './SearchHitsResults.vue';
import type { SearchParams } from 'typesense/lib/Typesense/Documents';

const store = useNodeStore();
const STORAGE_KEY_SEARCH_HISTORY = 'typesense-search-history';

const history = ref<string[]>([]);
const searchParameters = ref<SearchParams>({
  q: 'stark',
  query_by: 'company_name',
  filter_by: 'num_employees:>100',
  sort_by: 'num_employees:desc',
  page: 1,
  per_page: 10,
  exhaustive_search: true,
});
const jsonError = ref<string | null>(null);
const results = ref<any>(null);

const currentCollection = computed(() => store.currentCollection);

const searchParametersJson = computed({
  get: () => JSON.stringify(searchParameters.value, null, 2),
  set: (json: string) => {
    try {
      searchParameters.value = JSON.parse(json);
      jsonError.value = null;
    } catch (e) {
      jsonError.value = (e as Error).message;
    }
  },
});

const hits = computed(() => {
  if (!results.value?.hits) return [];

  return results.value.hits.map((item: any) => {
    const transformedItem = Object.assign({}, item.document);
    transformedItem._highlightResult = Object.keys(item.document).reduce(
      (obj: any, key: string) => {
        obj[key] = { value: String(item.document[key]) };
        return obj;
      },
      {},
    );
    item.highlights.forEach((h: any) => {
      transformedItem._highlightResult[h.field] = { value: h.snippet };
    });
    return transformedItem;
  });
});

const resultsJson = computed(() => JSON.stringify(results.value, null, 2));

const exportResults = () => {
  if (results.value) {
    store.exportToJson(results.value);
  }
};

const exportHits = () => {
  if (results.value?.hits) {
    const data = results.value.hits.map((h: any) => h.document);
    store.exportToJson(data);
  }
};

const removeHit = (id: string) => {
  if (!results.value?.hits) return;
  results.value.hits = results.value.hits.filter((hit: { document?: { id?: string } }) => {
    return hit.document?.id !== id;
  });
};

const saveHistory = () => {
  LocalStorage.set(
    `${STORAGE_KEY_SEARCH_HISTORY}-${currentCollection.value?.name || ''}`,
    history.value.slice(0, 20),
  );
};

const addToHistory = () => {
  const json = searchParametersJson.value;
  const index = history.value.indexOf(json);
  if (index === 0) return;
  if (index > 0) {
    history.value.splice(index, 1);
  }
  history.value.unshift(json);
  saveHistory();
};

const search = async () => {
  results.value = null;
  jsonError.value = null;
  addToHistory();
  try {
    results.value = await store.search(searchParameters.value);
  } catch (error) {
    jsonError.value = (error as Error).message;
  }
};

const loadHistory = () => {
  history.value =
    LocalStorage.getItem(`${STORAGE_KEY_SEARCH_HISTORY}-${currentCollection.value?.name || ''}`) ||
    [];
};

watch(currentCollection, loadHistory, { immediate: true });
</script>
