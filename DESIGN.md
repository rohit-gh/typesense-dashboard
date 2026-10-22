---
name: Typesense Dashboard
description: BaseStation editorial identity applied to a Typesense operations UI.
colors:
  ink: "#12100e"
  paper: "#e6e2d6"
  ink-muted: "rgba(18, 16, 14, 0.8)"
  paper-muted: "rgba(230, 226, 214, 0.8)"
  danger: "#9a3b32"
  success: "#4f6b45"
  warning: "#a67c2a"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, 'Times New Roman', serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Source Serif 4, Georgia, 'Times New Roman', serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  subhead:
    fontFamily: "Source Serif 4, Georgia, 'Times New Roman', serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Open Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0.01em"
  label:
    fontFamily: "Open Sans, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  none: "0px"
spacing:
  xs: "0.35rem"
  sm: "0.7rem"
  md: "1.25rem"
  lg: "2rem"
  xl: "2.5rem"
  page-desktop: "2.25rem 2.5rem 3rem"
  page-mobile: "1.5rem 1.25rem 2rem"
  login-desktop: "2.5rem 8vw"
  login-mobile: "2rem 6vw"
components:
  button-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.55rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0.4rem 0.7rem"
  input:
    backgroundColor: "{colors.paper-muted}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0.7rem 0.75rem"
---

## Overview

This is an Operate surface wearing BaseStation’s site identity: warm ink `#12100e`, paper `#e6e2d6`, Source Serif 4 for titles, Open Sans for UI and reading, IBM Plex Mono for data. The marketing site is a long column; this product is a dashboard. Brand color tokens stay exact. Layout density, type size, and measure are adapted so tables, forms, and JSON remain scannable.

Default theme is dark (ink field, paper type). Light theme inverts the pair, matching the BaseStation blog.

## Colors

| Token | Dark (default) | Light |
| --- | --- | --- |
| Background | `#12100e` | `#e6e2d6` |
| Text | `#e6e2d6` | `#12100e` |
| Muted | text at `0.8` | text at `0.8` |
| Hover | opacity `0.7` | opacity `0.7` |
| Border | paper at `0.18` | ink at `0.18` |
| Danger | `#9a3b32` | `#9a3b32` |
| Success | `#4f6b45` | `#4f6b45` |
| Warning | `#a67c2a` | `#a67c2a` |

No gray, no pure black, no purple accent. Status color is used only for success, warning, and danger. Selection, focus, and primary actions use the inverted pair (paper on ink, ink on paper).

## Typography

- **Wordmark and page titles:** Source Serif 4, 600, `2rem`, letter-spacing `-0.02em`. Optical size enabled.
- **Section titles:** Source Serif 4, `1.25rem`.
- **Subheads:** Source Serif 4, `1.125rem` — operation names, resource names, nested stats. Always larger than the copy beneath them.
- **UI, ledes, and buttons:** Open Sans 400 / 500. Root and body are `16px` / `1rem`. Ledes are the same size, muted, so they do not out-shout titles.
- **Labels and meta:** Open Sans 600, `0.8125rem`, muted. Field labels and nav groups. Table headers share the data size (`0.875rem`) so a row is one scale.
- **Code, IDs, hosts, metrics, table cells, JSON chrome:** IBM Plex Mono, `0.875rem`.

Do not put Source Serif 4 on buttons, table cells, or form labels. Load fonts from Google with `preconnect`, `display=swap`, and only the weights in use.

## Layout

- Mobile breakpoint: `768px`.
- Login: max-width `28rem`, padding `2.5rem 8vw` desktop / `2rem 6vw` mobile. 404: max-width `800px`, same inset.
- Authenticated pages: full width beside the nav, padding `2.25rem 2.5rem 3rem` desktop / `1.5rem 1.25rem 2rem` mobile. Inset is rem, not viewport units, so density does not jump with window size.
- Sidebar `15.5rem`, hairline separator, same field color as the page.
- One spacing scale: `0.35 / 0.7 / 1.25 / 2 / 2.5rem`. Related items (heading, copy, control) sit in a stack with `0.7rem`. Distinct groups separate with `2rem`. Major sections with `2.5rem`.
- No nested cards. Sections are headings plus space, not boxes in boxes.

## Elevation & Depth

Flat. Hierarchy comes from type, spacing, and hairline rules. No drop shadows, no glass, no gradient text.

## Shapes

Radius is `0`. Inputs are rectangular wells: stacked muted label above a 1px hairline field with a faint fill. Placeholders are muted; values are full paper/ink. Buttons are rectangular. Tables are rows under a hairline, not outlined panels.

## Components

- **Primary button:** inverted fill, no elevation, no all-caps, min-height matching the field. Hover at `0.7` opacity, `0.3s ease`.
- **Ghost / table actions:** underline at offset `4px` on hover, same transition. Never compete with the primary fill.
- **Field:** label 0.8125rem / 600 / muted, then the control. Do not float the label into the value.
- **Page head:** title left, one filter or primary action right.
- **Composer:** collapsed add/edit form. Progressive disclosure, not a second page title.
- **Table:** no icon-plus-title duplicate of the page heading. Filter lives in the page head.
- **Dialogs:** name the object and the verb on the title and the confirm button.
- **Editor:** Monaco on the field color, IBM Plex Mono metrics, no minimap.

## Do's and Don'ts

**Do**

- Keep the room quiet: one H1, one primary action, disclosed secondary work.
- Use the inverted pair for emphasis, never a new hue.
- Put JSON, IDs, and measurements in IBM Plex Mono.
- Honor `prefers-reduced-motion` (skip the 1.5s login fade).

**Don't**

- Kickers or eyebrows above headings.
- Nested cards, rounded SaaS tiles, or colored expansion headers.
- 20px body inside tables, nav, operations copy, or the sidebar.
- Bounce easing, page-load choreography on Operate screens, or gray type on a colored fill.
