import { onBeforeUnmount, onMounted, ref } from 'vue';

export function useNarrowViewport(query = '(max-width: 767px)') {
  const isNarrow = ref(false);
  let media: MediaQueryList | null = null;

  const sync = () => {
    isNarrow.value = Boolean(media?.matches);
  };

  onMounted(() => {
    media = window.matchMedia(query);
    sync();
    media.addEventListener('change', sync);
  });

  onBeforeUnmount(() => {
    media?.removeEventListener('change', sync);
  });

  return { isNarrow };
}
