<template>
  <ais-instant-search v-if="searchClient && currentCollection" :search-client="searchClient"
    :index-name="currentCollection.name" :middlewares="middlewares">
    <ais-configure :hits-per-page.camel="50" />
    <ais-search-box index-name="instant_search" :search-client="searchClient">
      <debounced-search-box />
    </ais-search-box>
    <ais-stats></ais-stats>
    <ais-current-refinements />

    <div class="search-layout q-mt-md">
      <div class="search-hits">
        <div class="search-hits-bar">
          <ais-pagination :padding="paginationPadding" />
          <search-hits-layout-switch />
        </div>
        <ais-hits>
          <template #default="{ items }">
            <search-hits-results :items="items || []" @deleted="instantSearchInstance.refresh()" />
          </template>
        </ais-hits>
        <ais-pagination class="q-my-md" :padding="paginationPadding" />
      </div>

      <component :is="isNarrow ? 'details' : 'div'" class="search-filters">
        <summary v-if="isNarrow" class="search-filters-toggle">Filters</summary>
        <aside class="search-facets" aria-label="Filters">
          <div class="facet-group">
            <div class="facet-field">
              <label class="field-label" for="facet-per-page">Per page</label>
              <ais-hits-per-page
                id="facet-per-page"
                :items="[
                  { label: '50', value: 50, default: true },
                  { label: '125', value: 125 },
                  { label: '250', value: 250 },
                ]"
              />
            </div>
            <q-btn flat no-caps dense class="facet-export" @click="exportPage()">Export this page</q-btn>
          </div>

          <div class="facet-group">
            <div class="facet-field">
              <label class="field-label">Sort</label>
              <ais-sort-by :items="sortBy" />
            </div>
            <div class="facet-field">
              <label class="field-label">Stopwords</label>
              <q-select
                v-model="currentStopwordsSet"
                :disable="!store.data.features.stopwords"
                outlined
                clearable
                dense
                options-dense
                :options="stopwords"
                @update:model-value="updateTypesenseAdapterConfiguration()"
              />
            </div>
          </div>

          <div class="facet-group">
            <div v-for="name in facetNumberFields" :key="name" class="facet-field">
              <label class="field-label">{{ name }}</label>
              <ais-range-input :attribute="name" />
            </div>

            <search-facet-list v-for="name in facetStringFields" :key="name" :attribute="name" searchable />

            <search-facet-list v-for="name in facetBooleanFields" :key="name" :attribute="name" />
          </div>
        </aside>
      </component>
    </div>
  </ais-instant-search>
  <div v-else-if="searchClientError">
    <q-banner inline-actions class="text-white bg-red">
      {{ searchClientError }}
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useNarrowViewport } from '../../composables/useNarrowViewport';
import {
  AisConfigure,
  AisCurrentRefinements,
  AisHits,
  AisHitsPerPage,
  AisInstantSearch,
  AisPagination,
  AisRangeInput,
  AisSearchBox,
  AisSortBy,
  AisStats,
} from 'vue-instantsearch/vue3/es';
import 'instantsearch.css/themes/reset.css';
import { useNodeStore } from '../../stores/node';
import SearchHitsLayoutSwitch from './SearchHitsLayoutSwitch.vue';
import SearchHitsResults from './SearchHitsResults.vue';
import SearchFacetList from './SearchFacetList.vue';
import DebouncedSearchBox from './DebouncedSearchBox.vue';
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection';

const store = useNodeStore();
const { isNarrow } = useNarrowViewport();
const searchClient = ref<any>(null);
const paginationPadding = computed(() => (isNarrow.value ? 1 : 3));
const typesenseInstantsearchAdapter = ref<TypesenseInstantSearchAdapter>();
const instantSearchInstance = ref<any>();
const searchClientError = ref<string | null>(null);
const currentStopwordsSet = ref(null);

const middlewares = [
  ({ instantSearchInstance: instance }: any) => {
    return {
      subscribe() {
        instantSearchInstance.value = instance;
      },
      unsubscribe() {
        instantSearchInstance.value = null;
      },
    };
  },
];

const currentCollection = computed((): CollectionSchema | null => {
  return store.currentCollection;
});

const facetNumberFields = computed((): string[] => {
  if (!currentCollection.value || !currentCollection.value.fields) return [];
  return currentCollection.value.fields
    .filter(
      (f) =>
        f.facet &&
        ['int32', 'int64', 'float', 'int32[]', 'int64[]', 'float[]'].includes(f.type) &&
        !f.name.includes('.*'),
    )
    .map((f) => f.name);
});

const facetStringFields = computed((): string[] => {
  if (!currentCollection.value || !currentCollection.value.fields) return [];
  return currentCollection.value.fields
    .filter((f) => f.facet && ['string', 'string[]'].includes(f.type) && !f.name.includes('.*'))
    .map((f) => f.name);
});

const facetBooleanFields = computed((): string[] => {
  if (!currentCollection.value || !currentCollection.value.fields) return [];
  return currentCollection.value.fields
    .filter((f) => f.facet && ['bool', 'bool[]'].includes(f.type) && !f.name.includes('.*'))
    .map((f) => f.name);
});

const sortBy = computed((): { value: string; label: string }[] => {
  if (!currentCollection.value || !currentCollection.value.fields) return [];
  const sortBy = [{ value: currentCollection.value.name, label: 'Default' }];
  currentCollection.value.fields
    .filter((f) => ['int32', 'float'].includes(f.type) || (f.type === 'string' && f.sort))
    .forEach((f) => {
      if (!currentCollection.value) return;
      sortBy.push({
        value: `${currentCollection.value.name}/sort/${f.name}:asc`,
        label: `${f.name} asc`,
      });
      sortBy.push({
        value: `${currentCollection.value.name}/sort/${f.name}:desc`,
        label: `${f.name} desc`,
      });
    });
  return sortBy;
});

const stopwords = computed(() => {
  return store.data.stopwords.map((set) => set.id);
});

const exportPage = () => {
  if (instantSearchInstance.value && currentCollection.value) {
    store.exportToJson(
      instantSearchInstance.value.renderState[currentCollection.value.name].hits.results.hits,
    );
  }
};

const updateTypesenseAdapterConfiguration = () => {
  if (typesenseInstantsearchAdapter.value && currentCollection.value) {
    typesenseInstantsearchAdapter.value.updateConfiguration({
      // @ts-expect-error internal property
      ...typesenseInstantsearchAdapter.value.configuration,
      additionalSearchParameters: {
        // @ts-expect-error internal property
        ...typesenseInstantsearchAdapter.value.configuration.additionalSearchParameters,
        stopwords: currentStopwordsSet.value,
      },
    });
  }
};

watch(
  () => currentCollection.value,
  () => {
    searchClient.value = null;
    searchClientError.value = null;

    window.setTimeout(() => {
      if (!store.loginData || !currentCollection.value) return;
      const query_by = (currentCollection.value?.fields || [])
        .filter((f) => f.index && ['string', 'string[]'].includes(f.type) && !f.name.includes('.*'))
        .map((f) => f.name)
        .join(',');

      try {
        const adapter = new TypesenseInstantSearchAdapter({
          server: {
            nodes: [
              {
                ...store.loginData.node,
              },
            ],
            apiKey: store.loginData.apiKey,
          },
          additionalSearchParameters: {
            exhaustive_search: true,
            query_by,
          },
        });
        typesenseInstantsearchAdapter.value = adapter;
        searchClient.value = adapter.searchClient;
      } catch (error) {
        searchClientError.value = (error as Error).message + 'Using query_by: ' + query_by;
        console.error(error);
      }
    });
  },
  { immediate: true },
);
</script>
