<template>
  <div class="search-json-composer" :class="{ 'search-json-composer--solo': !history.length }">
    <div class="search-json-editor">
      <monaco-editor v-model="searchParametersJson"></monaco-editor>
    </div>
    <aside v-if="history.length" class="search-json-history" aria-label="Recent queries">
      <q-list separator dense>
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
    </aside>
  </div>
  <q-banner v-if="parseError" inline-actions>
    This JSON is invalid: {{ parseError }}
  </q-banner>
  <q-banner v-else-if="queryError" inline-actions>
    {{ queryError }}
  </q-banner>
  <div class="search-json-actions">
    <q-btn unelevated color="primary" no-caps :disable="!!parseError || searching" @click="search()"
      >{{ searching ? 'Running query' : 'Run query' }}</q-btn
    >
    <q-btn flat no-caps :disable="!results || !results.hits" @click="exportHits()">Export hits</q-btn>
    <q-btn flat no-caps :disable="!results" @click="exportResults()">Export raw results</q-btn>
  </div>
  <p v-if="searching" class="muted">Running query.</p>
  <div v-else-if="results && results.hits" class="search-hits-json">
    <div class="search-hits-bar">
      <search-hits-layout-switch />
    </div>
    <search-hits-results :items="hits" @deleted="removeHit" />
  </div>
  <pre v-else-if="results && !results.hits" class="search-json-raw">{{ resultsJson }}</pre>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { LocalStorage } from 'quasar';
import { useNodeStore } from 'src/stores/node';
import MonacoEditor from 'src/components/MonacoEditor.vue';
import SearchHitsLayoutSwitch from './SearchHitsLayoutSwitch.vue';
import SearchHitsResults from './SearchHitsResults.vue';
import type { SearchParams } from 'typesense/lib/Typesense/Documents';
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection';

const store = useNodeStore();
const STORAGE_KEY_SEARCH_HISTORY = 'typesense-search-history';

function defaultSearchParams(collection: CollectionSchema | null): SearchParams {
  const query_by = (collection?.fields || [])
    .filter((field) => field.index && ['string', 'string[]'].includes(field.type) && !field.name.includes('.*'))
    .map((field) => field.name)
    .join(',');

  return {
    q: '*',
    ...(query_by ? { query_by } : {}),
    page: 1,
    per_page: 10,
    exhaustive_search: true,
  };
}

const history = ref<string[]>([]);
const searchParameters = ref<SearchParams>(defaultSearchParams(store.currentCollection));
const parseError = ref<string | null>(null);
const queryError = ref<string | null>(null);
const results = ref<any>(null);
const searching = ref(false);

const currentCollection = computed(() => store.currentCollection);

const searchParametersJson = computed({
  get: () => JSON.stringify(searchParameters.value, null, 2),
  set: (json: string) => {
    try {
      searchParameters.value = JSON.parse(json);
      parseError.value = null;
    } catch (e) {
      parseError.value = (e as Error).message;
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
  searching.value = true;
  results.value = null;
  queryError.value = null;
  addToHistory();
  try {
    results.value = await store.search(searchParameters.value);
  } catch (error) {
    queryError.value = (error as Error).message;
  } finally {
    searching.value = false;
  }
};

const loadHistory = () => {
  history.value =
    LocalStorage.getItem(`${STORAGE_KEY_SEARCH_HISTORY}-${currentCollection.value?.name || ''}`) ||
    [];
};

watch(
  currentCollection,
  (collection, previous) => {
    loadHistory();
    if (collection?.name !== previous?.name) {
      searchParameters.value = defaultSearchParams(collection);
      results.value = null;
      parseError.value = null;
      queryError.value = null;
    }
  },
  { immediate: true },
);
</script>
