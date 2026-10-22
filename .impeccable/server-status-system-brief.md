# Status · System

Mode: Operate.
Scope: the System block on Status (`src/pages/ServerStatus.vue`). Operations, Node, Typesense memory, and Stats stay as they are.

Audience: an operator at a desk who already connected. They glance for remaining CPU, memory, and disk, then leave. Cores matter only when overall CPU is high.

Job: answer headroom first. Then let them inspect cores without a monitoring product.

Constraints: live 2s refresh; no chart library; no nested cards, neon, or SaaS gauges; paper/ink/mono of the existing dashboard.

Memorable moment: remaining capacity is the large number; cores are a compact bar grid. Hover reads a core. Click pins it and a two-minute sparkline stays while they keep working.

## Direction contract

THESIS: System is a resource ledger of remaining capacity. It refuses a field of identical CPU rings and the four-KPI gauge row.

OWN-WORLD: hairline rules, rectangular wells, IBM Plex Mono for measurements, inverted pair for fill. Core bars are a single dense row in that well, not widgets.

STORY: the operator sees what is still free. If CPU is tight they scan the core row for hot bars, hover for the percent, pin one, and watch its sparkline while they work.

FIRST VIEWPORT: under System, four stacked ledgers — CPU, Memory, Disk, Network. Each: resource name, large remaining figure, muted used-of-total, a full-width fill bar. CPU adds a core count and a wrapping bar grid. Hover/focus updates a readout; click pins a sparkline under the grid. Signature interaction: pin a core, watch two minutes of samples.

FORM: resource ledger with a disclosed core map. Local extension of Status; no concept-seed.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
