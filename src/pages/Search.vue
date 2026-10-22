<template>
  <q-page class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Search</h1>
        <p class="page-lede">Browse hits, or send a raw JSON query.</p>
      </div>
    </header>

    <q-tabs v-model="tab" dense align="left" narrow-indicator>
      <q-tab name="form" label="InstantSearch" />
      <q-tab name="json" label="JSON" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated keep-alive>
      <q-tab-panel name="form" class="q-px-none">
        <search-instant-search />
      </q-tab-panel>
      <q-tab-panel name="json" class="q-pa-none">
        <search-json />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SearchJson from 'src/components/search/SearchJson.vue';
import SearchInstantSearch from 'src/components/search/SearchInstantSearch.vue';

const tab = ref('form');
</script>
