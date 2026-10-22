declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    DEV?: boolean | string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    TYPESENSE_API_KEY?: string;
    TYPESENSE_HOST?: string;
    TYPESENSE_PROTOCOL?: string;
    TYPESENSE_PORT?: string;
  }
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly TYPESENSE_API_KEY?: string;
  readonly TYPESENSE_HOST?: string;
  readonly TYPESENSE_PROTOCOL?: string;
  readonly TYPESENSE_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'vue-instantsearch/vue3/es';
declare module 'vue-instantsearch/vue3/es/src/mixins/widget.js';
