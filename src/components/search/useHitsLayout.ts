import { ref, watch } from 'vue';
import { LocalStorage } from 'quasar';

const STORAGE_KEY = 'typesense-hits-layout';

export type HitsLayout = 'table' | 'grid';

function readLayout(): HitsLayout {
  return LocalStorage.getItem(STORAGE_KEY) === 'grid' ? 'grid' : 'table';
}

const layout = ref<HitsLayout>(readLayout());

watch(layout, (value) => {
  LocalStorage.set(STORAGE_KEY, value);
});

export function useHitsLayout() {
  return { layout };
}
