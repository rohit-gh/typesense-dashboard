<template>
  <q-page class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Status</h1>
        <p class="page-lede">Live metrics for this node, plus cache, logging, and compaction.</p>
      </div>
    </header>

    <div class="status-layout">
      <div>
        <section class="page-section">
          <h2 class="page-section-title">System</h2>
          <system-metrics />
        </section>

        <section class="page-section">
          <h2 class="page-section-title">Operations</h2>

          <div class="action-stack">
            <article class="action">
              <h3 class="page-subhead">Search cache</h3>
              <p class="page-copy">
                Responses sent with <span class="mono">use_cache</span> live in an LRU cache.
              </p>
              <q-btn
                label="Clear search cache"
                color="primary"
                unelevated
                @click="store.clearCache"
              />
            </article>

            <article class="action">
              <h3 class="page-subhead">Slow request log</h3>
              <p class="page-copy">
                Requests over this threshold are written to the primary log with the prefix SLOW
                REQUEST. Use −1 to turn logging off.
              </p>
              <label class="field">
                <span class="field-label">Threshold (ms)</span>
                <div class="field-with-action">
                  <q-input
                    v-model.number="slowQueryThreshold"
                    borderless
                    type="number"
                    hide-bottom-space
                  />
                  <q-btn
                    unelevated
                    label="Save threshold"
                    color="primary"
                    @click="store.slowQueryThreshold(slowQueryThreshold)"
                  />
                </div>
              </label>
            </article>

            <article class="action">
              <h3 class="page-subhead">On-disk compaction</h3>
              <p class="page-copy">Run this during off-peak hours.</p>
              <q-btn
                label="Compact database"
                color="primary"
                unelevated
                @click="store.operationCompactDB"
              />
            </article>
          </div>
        </section>
      </div>

      <div>
        <section class="page-section">
          <h2 class="page-section-title">Node</h2>
          <dl class="dl">
            <dt>Protocol</dt>
            <dd>{{ store.loginData?.node.protocol }}</dd>
            <dt>Host</dt>
            <dd>{{ store.loginData?.node.host }}</dd>
            <dt>Port</dt>
            <dd>{{ store.loginData?.node.port }}</dd>
            <dt v-if="store.data.debug.version">Version</dt>
            <dd v-if="store.data.debug.version">{{ store.data.debug.version }}</dd>
            <dt v-if="Object.hasOwnProperty.call(store.data.debug, 'state')">Role</dt>
            <dd v-if="Object.hasOwnProperty.call(store.data.debug, 'state')">
              {{ store.data.debug.state === 1 ? 'Leader' : 'Follower' }}
            </dd>
          </dl>
        </section>

        <section class="page-section">
          <h2 class="page-section-title">Typesense memory</h2>
          <dl class="dl">
            <template
              v-for="metric in Object.keys(store.data.metrics).filter((m) => m.includes('typesense'))"
              :key="metric"
            >
              <dt>{{ metric.split('_')[2] }}</dt>
              <dd>
                {{
                  metric.includes('bytes')
                    ? prettyBytes(parseInt(store.data.metrics[metric], 10))
                    : store.data.metrics[metric]
                }}
              </dd>
            </template>
          </dl>
        </section>

        <section class="page-section">
          <h2 class="page-section-title">Stats</h2>
          <p v-if="!store.data.features.stats" class="page-copy">
            Stats are not enabled on this node.
          </p>
          <div v-for="(content, label) in store.data.stats" :key="label" class="stat-block">
            <div v-if="isObject(content)">
              <h3 class="page-subhead">{{ label }}</h3>
              <dl class="dl">
                <template v-for="(value, entry) in content" :key="entry">
                  <dt>{{ entry }}</dt>
                  <dd>{{ value }}</dd>
                </template>
              </dl>
            </div>
          </div>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useNodeStore } from 'src/stores/node';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import prettyBytes from 'pretty-bytes';
import SystemMetrics from '../components/SystemMetrics.vue';

const store = useNodeStore();

const refreshInterval = ref<number | undefined>(undefined);
const slowQueryThreshold = ref<number>(-1);

function isObject(obj: unknown) {
  return typeof obj === 'object';
}

onMounted(() => {
  refreshInterval.value = window.setInterval(() => {
    store.refreshServerStatus();
  }, 2000);
});

onBeforeUnmount(() => {
  window.clearInterval(refreshInterval.value);
});
</script>
