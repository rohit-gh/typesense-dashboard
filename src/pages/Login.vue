<template>
  <div class="login-screen">
    <div class="page-narrow">
      <header class="login-head">
        <h1>Typesense.</h1>
        <p class="login-lede">Connect to a node to manage collections, search, and keys.</p>
      </header>

      <q-form class="login-form" @submit.prevent="login()">
        <label class="field">
          <span class="field-label">API key</span>
          <q-input
            v-model="state.apiKey"
            borderless
            type="password"
            autocomplete="off"
            hide-bottom-space
          />
        </label>

        <div class="login-node">
          <label class="field">
            <span class="field-label">Protocol</span>
            <q-select
              v-model="state.node.protocol"
              borderless
              :options="state.protocolOptions"
              hide-bottom-space
            />
          </label>
          <label class="field field-host">
            <span class="field-label">Host</span>
            <q-input v-model="state.node.host" borderless type="text" hide-bottom-space />
          </label>
          <label class="field field-port">
            <span class="field-label">Port</span>
            <q-input
              v-model.number="state.node.port"
              borderless
              type="number"
              hide-bottom-space
            />
          </label>
          <label class="field field-path">
            <span class="field-label">Path <span class="field-optional">(optional)</span></span>
            <q-input
              v-model="state.node.path"
              borderless
              type="text"
              placeholder="/ or leave blank"
              hide-bottom-space
            />
          </label>
        </div>

        <q-toggle
          v-if="$q.platform.is.electron && state.node.protocol === 'https'"
          v-model="state.node.tls"
          label="Verify TLS"
        />

        <p v-if="store.error" class="login-error">{{ store.error }}</p>

        <div class="login-actions">
          <q-btn unelevated color="primary" type="submit" label="Connect" class="login-submit" />
          <q-btn flat no-caps label="Recent nodes" class="login-secondary">
            <q-menu>
              <server-history></server-history>
            </q-menu>
          </q-btn>
        </div>

        <p class="login-meta">
          {{
            $q.platform.is.electron
              ? 'Search still needs CORS enabled on the node.'
              : 'The node must allow CORS from this origin.'
          }}
        </p>
      </q-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import ServerHistory from '../components/ServerHistory.vue';
import { getDevNodeLogin } from '../shared/devNodeLogin';
import { useNodeStore } from '../stores/node';
import { onMounted, ref } from 'vue';

const store = useNodeStore();
const stored = store.loginData;
const devLogin = getDevNodeLogin();

onMounted(() => {
  if (store.loginData?.apiKey) {
    store.connectionCheck();
  }
});

const state = ref({
  apiKey: devLogin?.apiKey || stored?.apiKey || '',
  node: {
    host: devLogin?.node.host || stored?.node.host || 'localhost',
    port: devLogin?.node.port || stored?.node.port || 8108,
    protocol: devLogin?.node.protocol || stored?.node.protocol || 'http',
    path: stored?.node.path || '',
    tls: stored?.node.tls ?? true,
  },
  protocolOptions: ['http', 'https'],
});

function login() {
  void store.login({
    apiKey: state.value.apiKey.trim(),
    node: state.value.node,
  });
}
</script>
