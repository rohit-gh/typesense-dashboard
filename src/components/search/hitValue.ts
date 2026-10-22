const HIDDEN_KEYS = new Set([
  '_highlightResult',
  '_snippetResult',
  '_rankingInfo',
  'objectID',
  'text_match',
  '__position',
  '__hitIndex',
]);

export type HitItem = Record<string, any>;

export type FieldInfo = {
  name: string;
  type: string;
  embed?: unknown;
  num_dim?: number;
  known: boolean;
};

export function documentId(item: HitItem): string {
  return String(item.id ?? item.objectID ?? '');
}

export function copyForEdit(item: HitItem): Record<string, any> {
  const copy: Record<string, any> = {};
  Object.keys(item).forEach((key) => {
    if (!key.startsWith('_') && !['objectID', 'text_match'].includes(key)) {
      copy[key] = item[key];
    }
  });
  return JSON.parse(JSON.stringify(copy));
}

export function isHiddenKey(key: string): boolean {
  return HIDDEN_KEYS.has(key) || key.startsWith('_');
}

export function isUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return value.startsWith('http://') || value.startsWith('https://');
}

export function isImageUrl(value: unknown): boolean {
  if (!isUrl(value)) return false;
  const path = (value.split('?')[0] ?? '').toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].some((ext) =>
    path.endsWith(ext),
  );
}

export function hostname(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value;
  }
}

export function unwrapValue(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map((entry) => unwrapValue(entry));
  }
  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>;
    if ('value' in record && 'matchLevel' in record) {
      return record.value;
    }
    const next: Record<string, unknown> = {};
    Object.keys(record).forEach((key) => {
      next[key] = unwrapValue(record[key]);
    });
    return next;
  }
  return node;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function highlightedMarkup(value: string): { html: string | null; text: string } {
  const text = value
    .replace(/__ais-highlight__/g, '')
    .replace(/__\/ais-highlight__/g, '')
    .replace(/<\/?mark[^>]*>/gi, '');
  if (value.includes('__ais-highlight__')) {
    return {
      html: escapeHtml(value)
        .replace(/__ais-highlight__/g, '<mark>')
        .replace(/__\/ais-highlight__/g, '</mark>'),
      text,
    };
  }
  if (/<\/?mark/i.test(value)) {
    return {
      html: escapeHtml(value)
        .replace(/&lt;mark&gt;/gi, '<mark>')
        .replace(/&lt;\/mark&gt;/gi, '</mark>'),
      text,
    };
  }
  return { html: null, text: value };
}

export function highlightNode(item: HitItem, field: string): unknown {
  return item._highlightResult?.[field];
}

export function rawFieldValue(item: HitItem, field: string): unknown {
  return item[field];
}

export function isNumericType(type: string): boolean {
  return /^(int32|int64|float|geopoint)/.test(type);
}

export function isBoolType(type: string): boolean {
  return type === 'bool' || type === 'bool[]';
}

export function isArrayType(type: string): boolean {
  return type.endsWith('[]');
}

export function formatNumber(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return String(value ?? '');
  }
  return String(value);
}

export function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export function embeddingSize(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'string' && value.length) return value.split(',').length;
  return 0;
}

export function previewText(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
