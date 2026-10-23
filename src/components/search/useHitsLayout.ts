import { computed, ref, watch } from 'vue';
import { LocalStorage } from 'quasar';
import { useNarrowViewport } from '../../composables/useNarrowViewport';

const STORAGE_KEY = 'typesense-hits-layout';

export type HitsLayout = 'table' | 'grid';

function readLayout(): HitsLayout {
  return LocalStorage.getItem(STORAGE_KEY) === 'grid' ? 'grid' : 'table';
}

const stored = ref<HitsLayout>(readLayout());
const tableOnNarrow = ref(false);

watch(stored, (value) => {
  LocalStorage.set(STORAGE_KEY, value);
});

export function useHitsLayout() {
  const { isNarrow } = useNarrowViewport();

  const layout = computed({
    get(): HitsLayout {
      if (isNarrow.value && !tableOnNarrow.value) return 'grid';
      return stored.value;
    },
    set(value: HitsLayout) {
      stored.value = value;
      tableOnNarrow.value = isNarrow.value && value === 'table';
    },
  });

  return { layout };
}
