<template>
  <q-layout view="hHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          :icon="leftDrawerOpen ? 'sym_s_menu_open' : 'sym_s_menu'"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <span class="logo">Typesense.</span>
        </q-toolbar-title>

        <q-btn
          padding="xs sm"
          flat
          dense
          no-caps
          class="host-label"
          :title="store.loginData?.node.host"
        >
          <span class="host-text">{{ store.loginData?.node.host }}</span>
          <q-icon right name="sym_s_switch_account" />
          <q-menu>
            <server-history :show-logout="true"></server-history>
          </q-menu>
        </q-btn>
        <q-btn
          flat
          dense
          :icon="$q.dark.isActive ? 'sym_s_light_mode' : 'sym_s_dark_mode'"
          :title="$q.dark.isActive ? 'Use paper theme' : 'Use ink theme'"
          :aria-label="$q.dark.isActive ? 'Use paper theme' : 'Use ink theme'"
          @click="$q.dark.toggle()"
        />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above side="left" :width="248">
      <nav-menu></nav-menu>
    </q-drawer>

    <q-page-container>
      <q-banner v-if="store.error" inline-actions class="fixed-top z-max">
        {{ store.error }}
        <template #action>
          <q-btn flat label="Dismiss" @click="dismiss()" />
        </template>
      </q-banner>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import NavMenu from 'components/NavMenu.vue';
import ServerHistory from 'components/ServerHistory.vue';
import { useNodeStore } from 'src/stores/node';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const store = useNodeStore();
const route = useRoute();
const leftDrawerOpen = ref(false);

watch(
  () => route.fullPath,
  () => {
    leftDrawerOpen.value = false;
  },
);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function dismiss() {
  store.setError(null);
}
</script>
