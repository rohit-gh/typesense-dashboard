<template>
  <p v-if="!hasMetrics" class="muted">Metrics have not arrived yet.</p>

  <div v-else class="system">
    <article class="resource" :class="pressureClass(cpu.used)">
      <h3 class="resource-name">CPU</h3>
      <p class="resource-free metric">{{ formatPct(cpu.free) }}% free</p>
      <p class="resource-used metric muted">
        {{ formatPct(cpu.used) }}% used
        <template v-if="cores.length">· {{ cores.length }} cores</template>
      </p>
      <div
        class="resource-bar"
        role="meter"
        :aria-valuenow="meterValue(cpu.used)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`CPU used ${formatPct(cpu.used)} percent`"
      >
        <span class="resource-bar-fill" :style="{ width: `${clamp(cpu.used)}%` }" />
      </div>

      <div v-if="cores.length" class="cores">
        <p id="core-grid-hint" class="sr-only">
          Arrow keys move between cores. Enter pins a two-minute sparkline.
        </p>
        <div
          class="core-grid"
          role="listbox"
          tabindex="0"
          aria-labelledby="core-grid-label"
          aria-describedby="core-grid-hint"
          :aria-activedescendant="inspected ? `cpu-core-${inspected.id}` : 'cpu-core-none'"
          @keydown="onCoreKeydown"
          @focus="onGridFocus"
        >
          <span id="core-grid-label" class="sr-only">CPU cores</span>
          <button
            v-for="core in cores"
            :id="`cpu-core-${core.id}`"
            :key="core.id"
            type="button"
            role="option"
            class="core"
            :class="{
              pinned: pinnedId === core.id,
              active: inspected?.id === core.id,
              warn: core.value >= 80 && core.value < 95,
              danger: core.value >= 95,
            }"
            :aria-selected="pinnedId === core.id"
            tabindex="-1"
            :aria-label="coreLabel(core)"
            @mousedown.prevent
            @click="togglePin(core.id)"
            @mouseenter="hoverId = core.id"
            @mouseleave="hoverId = null"
          >
            <span class="core-fill" :style="{ height: `${clamp(core.value)}%` }" />
          </button>
        </div>

        <p class="core-readout metric" aria-live="polite">
          <template v-if="inspected">
            CPU {{ inspected.id }} · {{ formatPct(inspected.value) }}%
            <span v-if="inspected.value >= 95">full</span>
            <span v-else-if="inspected.value >= 80">high</span>
            <span v-if="pinnedId === inspected.id" class="muted">pinned</span>
          </template>
        </p>

        <svg
          v-if="pinnedId !== null && sparkPoints"
          class="spark"
          viewBox="0 0 240 40"
          preserveAspectRatio="none"
          role="img"
          :aria-label="`CPU ${pinnedId} over the last ${history.length} samples`"
        >
          <line class="spark-base" x1="0" y1="38" x2="240" y2="38" />
          <polyline :points="sparkPoints" />
        </svg>
        <p v-if="pinnedId !== null && sparkPoints" class="core-hint muted">Last two minutes</p>
        <p v-else-if="pinnedId !== null" class="core-hint muted">Collecting samples…</p>
      </div>
    </article>

    <article class="resource" :class="pressureClass(memory.usedPct)">
      <h3 class="resource-name">Memory</h3>
      <p class="resource-free metric">{{ formatBytes(memory.free) }} free</p>
      <p class="resource-used metric muted">
        {{ formatBytes(memory.used) }} of {{ formatBytes(memory.total) }}
        · {{ formatPct(memory.usedPct) }}% used
      </p>
      <div
        class="resource-bar"
        role="meter"
        :aria-valuenow="meterValue(memory.usedPct)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Memory used ${formatBytes(memory.used)} of ${formatBytes(memory.total)}`"
      >
        <span class="resource-bar-fill" :style="{ width: `${clamp(memory.usedPct)}%` }" />
      </div>
    </article>

    <article class="resource" :class="pressureClass(disk.usedPct)">
      <h3 class="resource-name">Disk</h3>
      <p class="resource-free metric">{{ formatBytes(disk.free) }} free</p>
      <p class="resource-used metric muted">
        {{ formatBytes(disk.used) }} of {{ formatBytes(disk.total) }}
        · {{ formatPct(disk.usedPct) }}% used
      </p>
      <div
        class="resource-bar"
        role="meter"
        :aria-valuenow="meterValue(disk.usedPct)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Disk used ${formatBytes(disk.used)} of ${formatBytes(disk.total)}`"
      >
        <span class="resource-bar-fill" :style="{ width: `${clamp(disk.usedPct)}%` }" />
      </div>
    </article>

    <article class="resource network">
      <h3 class="resource-name">Network</h3>
      <div class="network-grid">
        <div>
          <p class="resource-free metric">{{ formatRate(network.recvRate) }}</p>
          <p class="resource-used metric muted">Received · {{ formatBytes(network.recv) }} total</p>
        </div>
        <div>
          <p class="resource-free metric">{{ formatRate(network.sentRate) }}</p>
          <p class="resource-used metric muted">Sent · {{ formatBytes(network.sent) }} total</p>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import prettyBytes from 'pretty-bytes';
import { computed, ref, watch } from 'vue';
import { useNodeStore } from '../stores/node';

const MAX_SAMPLES = 60;

interface CoreReading {
  id: number;
  value: number;
}

interface Sample {
  t: number;
  cpu: number;
  cores: Record<number, number>;
  memoryUsed: number;
  memoryTotal: number;
  diskUsed: number;
  diskTotal: number;
  netRecv: number;
  netSent: number;
}

const store = useNodeStore();
const history = ref<Sample[]>([]);
const hoverId = ref<number | null>(null);
const pinnedId = ref<number | null>(null);
const keyboardId = ref<number | null>(null);

const hasMetrics = computed(() => Object.keys(store.data.metrics || {}).length > 0);

const cores = computed<CoreReading[]>(() => {
  const readings: CoreReading[] = [];
  for (const [key, raw] of Object.entries(store.data.metrics || {})) {
    const match = /^system_cpu(\d+)_active_percentage$/.exec(key);
    if (!match) continue;
    readings.push({
      id: Number(match[1]),
      value: toNumber(raw),
    });
  }
  return readings.sort((a, b) => a.id - b.id);
});

const cpu = computed(() => {
  const overall = toNumber(store.data.metrics?.system_cpu_active_percentage);
  const used = Number.isFinite(overall)
    ? overall
    : cores.value.length
      ? cores.value.reduce((sum, core) => sum + core.value, 0) / cores.value.length
      : NaN;
  return {
    used,
    free: Number.isFinite(used) ? Math.max(0, 100 - used) : NaN,
  };
});

const memory = computed(() => bytesPair('system_memory_used_bytes', 'system_memory_total_bytes'));
const disk = computed(() => bytesPair('system_disk_used_bytes', 'system_disk_total_bytes'));

const network = computed(() => {
  const recv = toNumber(store.data.metrics?.system_network_received_bytes);
  const sent = toNumber(store.data.metrics?.system_network_sent_bytes);
  const prev = history.value.length >= 2 ? history.value[history.value.length - 2] : undefined;
  const last = history.value[history.value.length - 1];
  const dt = prev && last ? (last.t - prev.t) / 1000 : 0;
  return {
    recv,
    sent,
    recvRate: rateFrom(prev?.netRecv, last?.netRecv, dt),
    sentRate: rateFrom(prev?.netSent, last?.netSent, dt),
  };
});

const inspected = computed<CoreReading | null>(() => {
  const id = hoverId.value ?? keyboardId.value ?? pinnedId.value;
  if (id === null) return null;
  return cores.value.find((core) => core.id === id) ?? null;
});

const sparkPoints = computed(() => {
  const pinned = pinnedId.value;
  if (pinned === null) return '';
  const values: number[] = [];
  for (const sample of history.value) {
    const value = sample.cores[pinned];
    if (typeof value === 'number' && Number.isFinite(value)) {
      values.push(value);
    }
  }
  if (values.length < 2) return '';
  return polyline(values, 240, 40, 2);
});

watch(
  () => store.data.metrics,
  (metrics) => {
    if (!metrics || Object.keys(metrics).length === 0) return;
    const now = Date.now();
    const last = history.value[history.value.length - 1];
    if (last && now - last.t < 400) return;
    const sample: Sample = {
      t: now,
      cpu: cpu.value.used,
      cores: Object.fromEntries(cores.value.map((core) => [core.id, core.value])),
      memoryUsed: memory.value.used,
      memoryTotal: memory.value.total,
      diskUsed: disk.value.used,
      diskTotal: disk.value.total,
      netRecv: toNumber(metrics.system_network_received_bytes),
      netSent: toNumber(metrics.system_network_sent_bytes),
    };
    history.value = [...history.value.slice(-(MAX_SAMPLES - 1)), sample];
  },
  { deep: true, immediate: true },
);

function bytesPair(usedKey: string, totalKey: string) {
  const used = toNumber(store.data.metrics?.[usedKey]);
  const total = toNumber(store.data.metrics?.[totalKey]);
  const usedPct = total > 0 ? (used / total) * 100 : NaN;
  return {
    used,
    total,
    free: Number.isFinite(used) && Number.isFinite(total) ? Math.max(0, total - used) : NaN,
    usedPct,
  };
}

function toNumber(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  const n = parseFloat(String(raw ?? ''));
  return Number.isFinite(n) ? n : NaN;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function meterValue(n: number): number {
  return Math.round(clamp(n));
}

function formatPct(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return prettyBytes(n);
}

function formatRate(n: number): string {
  if (!Number.isFinite(n)) return '—/s';
  return `${prettyBytes(n)}/s`;
}

function rateFrom(prev: number | undefined, next: number | undefined, dt: number): number {
  if (!Number.isFinite(prev) || !Number.isFinite(next) || dt <= 0) return NaN;
  if ((next as number) < (prev as number)) return NaN;
  return ((next as number) - (prev as number)) / dt;
}

function pressureClass(usedPct: number): Record<string, boolean> {
  return {
    warn: usedPct >= 80 && usedPct < 95,
    danger: usedPct >= 95,
  };
}

function coreLabel(core: CoreReading): string {
  const heat = core.value >= 95 ? ', full' : core.value >= 80 ? ', high' : '';
  return `CPU ${core.id}, ${formatPct(core.value)} percent${heat}`;
}

function polyline(values: number[], width: number, height: number, pad: number): string {
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  return values
    .map((value, index) => {
      const x = pad + (index / (values.length - 1)) * innerW;
      const y = pad + (1 - clamp(value) / 100) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function togglePin(id: number) {
  pinnedId.value = pinnedId.value === id ? null : id;
  keyboardId.value = id;
}

function onGridFocus() {
  if (keyboardId.value === null) {
    keyboardId.value = pinnedId.value ?? cores.value[0]?.id ?? null;
  }
}

function onCoreKeydown(event: KeyboardEvent) {
  if (!cores.value.length) return;
  const ids = cores.value.map((core) => core.id);
  const current = keyboardId.value ?? pinnedId.value ?? ids[0] ?? 0;
  const index = Math.max(0, ids.indexOf(current));
  let nextIndex = index;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = Math.min(ids.length - 1, index + 1);
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = Math.max(0, index - 1);
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = ids.length - 1;
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const target = ids[index];
    if (target !== undefined) togglePin(target);
    return;
  } else {
    return;
  }

  event.preventDefault();
  const nextId = ids[nextIndex];
  if (nextId !== undefined) keyboardId.value = nextId;
}
</script>

<style scoped>
.system {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.resource {
  padding: 0 0 1.25rem;
  border-bottom: 1px solid var(--bs-border);
}

.resource:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.resource-name {
  margin: 0;
  font-size: var(--bs-type-subhead);
  line-height: 1.3;
}

.resource-free {
  margin: 0.2rem 0 0;
  font-size: var(--bs-type-display);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.resource-used {
  margin: 0.25rem 0 var(--bs-space-sm);
  font-size: var(--bs-type-data);
}

.resource-bar {
  position: relative;
  height: 0.5rem;
  background: var(--bs-fill);
}

.resource-bar-fill {
  display: block;
  height: 100%;
  background: var(--bs-fg);
  transform-origin: left center;
  transition: width 0.2s ease;
}

.resource.warn .resource-bar-fill,
.core.warn .core-fill {
  background: var(--bs-warning);
}

.resource.danger .resource-bar-fill,
.core.danger .core-fill {
  background: var(--bs-danger);
}

.cores {
  margin-top: 0.85rem;
}

.core-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0.45rem, 1fr));
  grid-auto-rows: 2.6rem;
  gap: 0.18rem;
  padding: 0.4rem;
  background: var(--bs-fill);
  border: 1px solid var(--bs-border);
}

.core-grid:focus-visible {
  outline: 1px solid var(--bs-fg);
  outline-offset: 4px;
}

.core {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: var(--bs-border);
  cursor: pointer;
  appearance: none;
}

.core::after {
  content: '';
  position: absolute;
  inset: -0.35rem -0.08rem;
}

.core-fill {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  background: var(--bs-fg);
  pointer-events: none;
  transition: height 0.2s ease;
}

.core.active {
  outline: 1px solid var(--bs-fg);
  outline-offset: 1px;
}

.core.pinned {
  outline: 1px solid var(--bs-fg);
  outline-offset: 2px;
}

.core-readout {
  margin: 0.55rem 0 0;
  font-size: var(--bs-type-data);
  min-height: 1.35em;
}

.core-readout span + span {
  margin-left: 0.55rem;
}

.core-hint {
  margin: 0.25rem 0 0;
  font-size: var(--bs-type-data);
}

.spark {
  display: block;
  width: 100%;
  height: 2.6rem;
  margin-top: 0.55rem;
}

.spark-base {
  stroke: var(--bs-border);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.spark polyline {
  fill: none;
  stroke: var(--bs-fg);
  stroke-width: 1.25;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.network-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1.25rem;
  margin-top: 0.2rem;
}

.network .resource-used {
  margin-bottom: 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .resource-free {
    font-size: var(--bs-type-headline);
  }

  .core-grid {
    grid-auto-rows: 2.8rem;
    padding: 0.45rem 0.35rem;
  }

  .core::after {
    inset: -0.5rem -0.14rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .resource-bar-fill,
  .core-fill {
    transition: none;
  }
}
</style>
