<template>
  <div :class="['hit-cell', { 'hit-cell--num': numeric }]">
    <template v-if="empty"> </template>

    <template v-else-if="embed">
      <span class="hit-cell__meta">{{ embedLabel }}</span>
    </template>

    <template v-else-if="imageSrc">
      <img :src="imageSrc" :alt="field.name" class="hit-cell__thumb" />
    </template>

    <template v-else-if="linkHref">
      <a :href="linkHref" target="_blank" rel="noreferrer" :title="linkHref" @click.stop>{{
        linkLabel
      }}</a>
    </template>

    <template v-else-if="booleanLabel !== null">
      {{ booleanLabel }}
    </template>

    <template v-else-if="numeric && !isArray">
      {{ numericLabel }}
    </template>

    <template v-else-if="singleItem">
      <span
        v-if="singleItem.html"
        class="hit-cell__text"
        :title="singleItem.text"
        v-html="singleItem.html"
      ></span>
      <span v-else class="hit-cell__text" :title="singleItem.text">{{ singleItem.text }}</span>
    </template>

    <template v-else-if="isArray || isObject">
      <button
        type="button"
        class="hit-cell__toggle"
        :aria-expanded="expanded"
        @click.stop="expanded = !expanded"
      >
        {{ summary }}
      </button>
      <div v-if="expanded" class="hit-cell__open">
        <template v-if="stringItems">
          <div v-for="(entry, index) in stringItems" :key="index" class="hit-cell__line">
            <span v-if="entry.html" v-html="entry.html"></span>
            <template v-else>{{ entry.text }}</template>
          </div>
        </template>
        <pre v-else class="hit-cell__json">{{ jsonText }}</pre>
      </div>
    </template>

    <span v-else-if="text.html" class="hit-cell__text" :title="text.text" v-html="text.html"></span>
    <span v-else class="hit-cell__text" :title="text.text">{{ text.text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FieldInfo, HitItem } from './hitValue';
import {
  arrayLength,
  embeddingSize,
  formatNumber,
  highlightedMarkup,
  hostname,
  isBoolType,
  isImageUrl,
  isNumericType,
  isUrl,
  previewText,
  rawFieldValue,
  unwrapValue,
} from './hitValue';

const props = defineProps<{
  item: HitItem;
  field: FieldInfo;
}>();

const expanded = ref(false);

watch(
  () => [props.item, props.field.name],
  () => {
    expanded.value = false;
  },
);

const raw = computed(() => rawFieldValue(props.item, props.field.name));
const highlight = computed(() => props.item._highlightResult?.[props.field.name]);
const value = computed(() => raw.value);

const embed = computed(
  () =>
    Boolean(props.field.embed) || Boolean(props.field.num_dim) || isLikelyEmbedding(value.value),
);
const numeric = computed(() => isNumericType(props.field.type));
const isArray = computed(() => Array.isArray(value.value) || props.field.type.endsWith('[]'));
const isObject = computed(() => {
  if (isArray.value || embed.value) return false;
  return Boolean(value.value) && typeof value.value === 'object';
});
const empty = computed(() => {
  const current = value.value;
  if (current == null || current === '') return true;
  if (Array.isArray(current) && current.length === 0) return true;
  return false;
});

const embedLabel = computed(() => {
  const size = props.field.num_dim || embeddingSize(value.value);
  return size ? `${size}-d` : 'vector';
});

const imageSrc = computed(() => {
  if (embed.value || isArray.value) return '';
  return isImageUrl(value.value) ? String(value.value) : '';
});

const linkHref = computed(() => {
  if (imageSrc.value || embed.value || isArray.value) return '';
  return isUrl(value.value) ? String(value.value) : '';
});

const linkLabel = computed(() => (linkHref.value ? hostname(linkHref.value) : ''));

const booleanLabel = computed(() => {
  if (!isBoolType(props.field.type) && typeof value.value !== 'boolean') return null;
  if (Array.isArray(value.value)) return null;
  if (typeof value.value === 'boolean') return value.value ? 'true' : 'false';
  if (value.value === 'true' || value.value === 'false') return String(value.value);
  return null;
});

const numericLabel = computed(() => formatNumber(value.value));

const summary = computed(() => {
  if (isArray.value) {
    const count = arrayLength(value.value);
    const label = props.field.name.replace(/_/g, ' ');
    return count === 1 ? `1 ${label.replace(/s$/, '')}` : `${count} ${label}`;
  }
  return '{…}';
});

const stringItems = computed(() => {
  const highlightNodes = Array.isArray(highlight.value) ? highlight.value : null;
  const rawNodes = Array.isArray(value.value) ? value.value : null;
  if (!isArray.value || !rawNodes) return null;
  const nested = rawNodes.some((node) => node != null && typeof node === 'object');
  if (nested) return null;
  const nodes = highlightNodes || rawNodes;
  return nodes.map((node) => {
    if (node && typeof node === 'object' && 'value' in node) {
      return highlightedMarkup(String((node as { value: unknown }).value ?? ''));
    }
    return highlightedMarkup(previewText(unwrapValue(node)));
  });
});

const singleItem = computed(() => {
  if (!isArray.value || arrayLength(value.value) !== 1) return null;
  return stringItems.value?.[0] ?? null;
});

const jsonText = computed(() => {
  try {
    return JSON.stringify(value.value, null, 2);
  } catch {
    return previewText(value.value);
  }
});

const text = computed(() => {
  const node = highlight.value;
  if (node && typeof node === 'object' && 'value' in node) {
    return highlightedMarkup(String((node as { value: unknown }).value ?? ''));
  }
  return highlightedMarkup(previewText(value.value));
});

function isLikelyEmbedding(current: unknown): boolean {
  return (
    Array.isArray(current) && current.length > 32 && current.every((n) => typeof n === 'number')
  );
}
</script>
