<template>
  <div class="hits-ledger-actions-bar" @click.stop>
    <q-btn unelevated dense color="primary" no-caps icon="sym_s_edit" @click="$emit('edit')"
      >Edit document</q-btn
    >
    <q-btn
      flat
      dense
      no-caps
      icon="sym_s_delete"
      class="hits-ledger-delete"
      @click="$emit('delete')"
      >Delete document</q-btn
    >
    <q-btn
      flat
      dense
      no-caps
      class="hits-ledger-actions-close"
      icon="close"
      aria-label="Close"
      @click="$emit('close')"
    />
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  edit: [];
  delete: [];
  close: [];
}>();
</script>
