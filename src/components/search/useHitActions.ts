import { computed, nextTick, ref, watch, type Ref } from 'vue';
import { useQuasar } from 'quasar';
import { useNodeStore } from '../../stores/node';
import { copyForEdit, documentId, type HitItem } from './hitValue';

export function useHitActions(
  items: () => HitItem[],
  emit: (event: 'deleted', id: string) => void,
  scroller: Ref<HTMLElement | null>,
) {
  const store = useNodeStore();
  const $q = useQuasar();
  const selectedId = ref<string | null>(null);

  watch(
    () => items().map((item) => documentId(item)),
    (ids) => {
      if (selectedId.value && !ids.includes(selectedId.value)) {
        selectedId.value = null;
      }
    },
  );

  const selectedItem = computed(
    () => items().find((item) => documentId(item) === selectedId.value) || null,
  );

  function close() {
    selectedId.value = null;
  }

  function select(id: string) {
    if (selectedId.value === id) {
      close();
      return;
    }
    selectedId.value = id;
    scroller.value?.focus({ preventScroll: true });
    void nextTick(() => {
      const row = scroller.value?.querySelector('.is-selected');
      row?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  function move(delta: number) {
    const list = items();
    if (!list.length) return;
    const ids = list.map((item) => documentId(item));
    const current = selectedId.value ? ids.indexOf(selectedId.value) : -1;
    const next = current === -1 ? (delta > 0 ? 0 : ids.length - 1) : current + delta;
    const id = ids[next];
    if (!id) return;
    select(id);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      const first = items()[0];
      if (first) select(documentId(first));
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = items()[items().length - 1];
      if (last) select(documentId(last));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      editSelected();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  }

  function editSelected() {
    if (!selectedItem.value) return;
    void store.editDocuments([copyForEdit(selectedItem.value)]);
  }

  function deleteSelected() {
    const item = selectedItem.value;
    if (!item) return;
    const id = documentId(item);
    $q.dialog({
      title: `Delete document ${id}?`,
      message: 'This document will be removed from the collection.',
      cancel: { flat: true, label: 'Keep document', color: 'primary' },
      ok: { unelevated: true, label: 'Delete document', color: 'negative' },
      persistent: true,
    }).onOk(() => {
      store
        .deleteDocumentById(id)
        ?.then(() => {
          selectedId.value = null;
          emit('deleted', id);
        })
        .catch((error: Error) => {
          $q.notify({
            type: 'negative',
            message: `Error deleting document: ${error.message}`,
          });
        });
    });
  }

  return {
    selectedId,
    select,
    close,
    onKeydown,
    editSelected,
    deleteSelected,
  };
}
