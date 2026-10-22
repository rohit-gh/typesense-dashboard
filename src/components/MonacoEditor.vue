<template>
  <div ref="editorWrapper" class="col relative-position overflow-hidden editorWrapper">
    <q-resize-observer @resize="onResize" />
    <div ref="editorElement" class="absolute-top-left"></div>
  </div>
</template>
<script lang="ts">
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/editor/standalone/browser/standalone-tokens.css';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import { Dark } from 'quasar';
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';

const INK = '#12100e';
const PAPER = '#e6e2d6';

monaco.editor.defineTheme('basestation-ink', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': INK,
    'editor.foreground': PAPER,
    'editor.lineHighlightBackground': '#1c1916',
    'editorLineNumber.foreground': '#e6e2d6cc',
    'editorCursor.foreground': PAPER,
    'editor.selectionBackground': '#e6e2d633',
    'editorWidget.background': INK,
    'editorWidget.foreground': PAPER,
  },
});

monaco.editor.defineTheme('basestation-paper', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': PAPER,
    'editor.foreground': INK,
    'editor.lineHighlightBackground': '#ddd8c8',
    'editorLineNumber.foreground': '#12100ecc',
    'editorCursor.foreground': INK,
    'editor.selectionBackground': '#12100e22',
    'editorWidget.background': PAPER,
    'editorWidget.foreground': INK,
  },
});

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'json') {
      return new jsonWorker();
    }
    return new editorWorker();
  },
};

export default defineComponent({
  name: 'MonacoEditor',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    options: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const editorElement = ref<HTMLElement | null>(null);
    const editorWrapper = ref<HTMLElement | null>(null);
    let editor: monaco.editor.IStandaloneCodeEditor | undefined;
    onMounted(() => {
      editor = monaco.editor.create(
        editorElement.value as HTMLElement,
        Object.assign(
          {
            value: props.modelValue,
            language: 'json',
            theme: Dark.isActive ? 'basestation-ink' : 'basestation-paper',
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            fontSize: 16,
            minimap: {
              enabled: false,
            },
          },
          props.options,
        ),
      );
      editor.onDidChangeModelContent(() => {
        emit('update:modelValue', editor?.getValue());
      });
    });
    onUnmounted(() => {
      editor?.dispose();
    });

    watch(
      () => props.modelValue,
      () => {
        if (props.modelValue !== editor?.getValue()) {
          editor?.getModel()?.setValue(props.modelValue);
          editor?.setScrollPosition({ scrollTop: 0 });
        }
      },
    );
    watch(
      () => Dark.isActive,
      (isDark) => {
        monaco.editor.setTheme(isDark ? 'basestation-ink' : 'basestation-paper');
      },
    );
    return {
      editorElement,
      editorWrapper,
      onResize() {
        editor?.layout({ height: 0, width: 0 });
        window.setTimeout(() => {
          editor?.layout({
            height: (editorWrapper.value as HTMLElement).offsetHeight,
            width: (editorWrapper.value as HTMLElement).offsetWidth,
          });
        });
      },
    };
  },
});
</script>

<style scoped>
.editorWrapper {
  background-color: var(--bs-bg);
}
</style>
