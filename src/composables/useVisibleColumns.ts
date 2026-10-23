import { computed } from 'vue';
import { useNarrowViewport } from './useNarrowViewport';

export function useVisibleColumns(desktop: string[], phone: string[]) {
  const { isNarrow } = useNarrowViewport();
  return computed(() => (isNarrow.value ? phone : desktop));
}
