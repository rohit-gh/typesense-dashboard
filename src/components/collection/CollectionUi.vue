<template>
  <div>
    <q-tabs v-model="tab" dense align="left" narrow-indicator>
      <q-tab name="form" label="Form" />
      <q-tab name="json" label="JSON" />
    </q-tabs>

    <q-tab-panels v-model="tab" keep-alive>
      <q-tab-panel name="form" class="q-pa-none">
        <div class="field-grid">
          <label class="field">
            <span class="field-label">Collection name</span>
            <q-input
              v-model="schema.name"
              borderless
              hide-bottom-space
              placeholder="books"
              :disable="!createMode"
              :rules="[(val) => !!val || 'Enter a collection name']"
            />
          </label>
          <label class="field">
            <span class="field-label">Default sort field <span class="field-optional">(optional)</span></span>
            <q-select
              v-model="schema.default_sorting_field"
              borderless
              hide-bottom-space
              :options="availableSortFields"
            />
            <p class="field-hint">Must be int32, float, or a string marked sortable.</p>
          </label>
        </div>

        <h3 class="page-subhead">Fields</h3>
        <div v-for="(field, index) in schema.fields" :key="index" class="field-row">
          <div class="field-grid">
            <label class="field">
              <span class="field-label">Field name</span>
              <q-input
                v-model="field.name"
                borderless
                hide-bottom-space
                placeholder="title"
                :rules="[(val) => !!val || 'Enter a field name']"
              />
            </label>
            <label class="field">
              <span class="field-label">Type</span>
              <q-select
                v-model="field.type"
                borderless
                hide-bottom-space
                :options="types"
                :rules="[(val) => !!val || 'Choose a type']"
              />
            </label>
            <label v-if="field.type === 'float[]'" class="field">
              <span class="field-label">Dimensions</span>
              <q-input v-model.number="field.num_dim" borderless hide-bottom-space type="number" />
            </label>
            <label v-if="field.type.startsWith('string')" class="field">
              <span class="field-label">Locale <span class="field-optional">(optional)</span></span>
              <q-input v-model="field.locale" borderless hide-bottom-space />
            </label>
          </div>
          <div class="field-row-actions">
            <div class="field-flags">
              <q-checkbox v-model="field.optional" label="optional" />
              <q-checkbox v-model="field.facet" label="facet" />
              <q-checkbox v-model="field.index" label="index" />
              <q-checkbox v-model="field.sort" label="sort" />
              <q-checkbox v-model="field.infix" label="infix" />
              <q-checkbox v-model="field.stem" label="stem" />
            </div>
            <q-btn flat no-caps @click="removeField(field)">Remove field</q-btn>
          </div>
        </div>
      </q-tab-panel>

      <q-tab-panel name="json" class="q-pa-none">
        <monaco-editor v-if="tab === 'json'" v-model="schemaJson" class="editor-pane"></monaco-editor>
        <q-banner v-if="jsonError" inline-actions>
          This JSON is invalid: {{ jsonError }}
        </q-banner>
      </q-tab-panel>
    </q-tab-panels>

    <div class="form-actions">
      <q-btn flat no-caps @click="addField()">Add field</q-btn>
      <q-btn unelevated color="primary" no-caps @click="$emit('submit', schema)">{{
        primaryActionLabel
      }}</q-btn>
    </div>
  </div>
</template>

<script lang="ts">
import type {
  CollectionFieldSchema,
  CollectionSchema,
  CollectionUpdateSchema,
} from 'typesense/lib/Typesense/Collection';
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { defineAsyncComponent, defineComponent } from 'vue';

export default defineComponent({
  name: 'CollectionUi',
  components: {
    MonacoEditor: defineAsyncComponent(() => import('../MonacoEditor.vue')),
  },
  props: {
    initialSchema: {
      type: Object as () => CollectionCreateSchema | CollectionSchema | CollectionUpdateSchema,
      default: () =>
        ({
          name: '',
          fields: [
            {
              name: '',
              type: 'string',
              facet: false,
              optional: false,
              index: true,
              sort: false,
              infix: false,
              stem: false,
              locale: '',
              num_dim: undefined,
            } as unknown,
          ],
          default_sorting_field: '',
          token_separators: [],
          symbols_to_index: [],
          enable_nested_fields: false,
        }) as CollectionCreateSchema,
    },
    primaryActionLabel: {
      type: String,
      required: true,
    },
    createMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['submit'],
  data() {
    return {
      tab: 'form',
      schema: {
        name: '',
        fields: [],
        default_sorting_field: '',
        token_separators: [],
        symbols_to_index: [],
        enable_nested_fields: false,
      } as CollectionCreateSchema,
      types: [
        'string',
        'string[]',
        'int32',
        'int32[]',
        'int64',
        'int64[]',
        'float',
        'float[]',
        'bool',
        'bool[]',
        'geopoint',
        'geopoint[]',
        'object',
        'object[]',
        'string*',
        'auto',
      ],
      jsonError: null as string | null,
    };
  },
  computed: {
    availableSortFields(): string[] {
      const compatibleFields = (this.schema.fields || []).filter(
        (field) =>
          ['int32', 'float'].includes(field.type) || (field.type === 'string' && field.sort),
      );
      // empty option + compatible field names
      return [''].concat(compatibleFields.map((field) => field.name));
    },
    schemaJson: {
      get(): string {
        return JSON.stringify(this.schema, null, 2);
      },
      set(json: string) {
        try {
          this.schema = JSON.parse(json);
          this.jsonError = null;
        } catch (e) {
          this.jsonError = (e as Error).message;
        }
      },
    },
  },
  watch: {
    initialSchema: {
      immediate: true,
      handler(schema: CollectionCreateSchema) {
        this.schema = JSON.parse(JSON.stringify(schema));
      },
    },
  },
  methods: {
    addField() {
      if (this.schema.fields) {
        // @ts-expect-error custom field
        this.schema.fields.push({
          name: '',
          type: 'string',
          facet: false,
          optional: false,
          index: true,
          sort: false,
          infix: false,
          stem: false,
          locale: '',
          num_dim: undefined,
        });
      }
    },
    removeField(field: CollectionFieldSchema) {
      if (this.schema.fields) {
        const index = this.schema.fields.indexOf(field);
        if (index > -1) {
          this.schema.fields.splice(index, 1);
        }
      }
    },
  },
});
</script>
