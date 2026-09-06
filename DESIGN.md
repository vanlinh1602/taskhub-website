---
name: Taskory Hub
description: Calm operational workspace UI for teams coordinating work, stories, and deadlines.
colors:
  primary: "#9fa1ff"
  primary-soft: "#b5baff"
  sky: "#aee2ff"
  mint: "#d9f9df"
  canvas: "#f8f9ff"
  foreground: "#242642"
  border: "#dfe2f3"
  destructive: "#c65b78"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.12em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "0.875rem"
  xl: "1.75rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "2rem"
    padding: "0 0.625rem"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "2rem"
    padding: "0 0.625rem"
  surface:
    backgroundColor: "#ffffff"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "2rem"
---

# Design System: Taskory Hub

## Overview

**Creative North Star: "The Calm Control Room"**

Taskory Hub uses a friendly, operational visual language: a cool canvas, soft pastel accents, compact controls, and generous separation between configuration groups. The interface should feel like a dependable team workspace rather than a promotional dashboard. The primary accent is used for action, selection, and progress so the user can scan state without decoding decoration.

Workspace settings uses one clear status surface at the top, then open sections with quiet dividers. Summary context is compact and useful: IDs, read-only metadata, progress, and integration counts stay visible without turning every block into a card.

**Key Characteristics:**
- Mint/lavender accent on a cool near-white canvas.
- System sans typography with strong weight contrast and tight labels.
- Soft rounded surfaces used for meaningful grouping, not every row.
- Borders and tonal layers do most of the structural work; shadows stay ambient.

## Colors

The palette pairs a lavender primary with sky and mint support tones over cool neutrals.

### Primary
- **Lavender action** (#9fa1ff): primary actions, progress, selected states, and active status.
- **Lavender soft** (#b5baff): dark-theme primary support and chart variations.

### Secondary
- **Sky support** (#aee2ff): calm informational surfaces and secondary data accents.
- **Mint support** (#d9f9df): positive and integration-ready states.

### Neutral
- **Cool canvas** (#f8f9ff): application background.
- **Ink** (#242642): primary text and high-contrast content.
- **Cool border** (#dfe2f3): dividers, field strokes, and surface boundaries.
- **Destructive rose** (#c65b78): destructive actions and error states.

### Named Rules
**The Signal Rule.** Use the lavender accent for action and state, not for decorative repetition.

## Typography

**Display Font:** System UI sans stack
**Body Font:** System UI sans stack
**Label/Mono Font:** System UI sans for labels; system monospace for IDs.

**Character:** Compact, friendly, and highly legible. Strong weights carry hierarchy before color does; uppercase tracking is reserved for small section labels.

### Hierarchy
- **Display** (800, 2.25rem, 1.1): workspace names and dominant screen context.
- **Title** (700–800, 1rem–1.125rem, 1.25): section and control-group titles.
- **Body** (400, 0.875rem, 1.5): descriptions, labels, and supporting copy.
- **Label** (700, 0.75rem, 1.25, 0.12em tracking, uppercase): section markers and compact status context.

## Layout

Use a centered max-width workspace inside the existing sidebar/inset shell. Workspace settings opens with a single summary surface, followed by a two-column desktop layout: the editable flow on the left and a sticky configuration map on the right. At mobile widths, the map follows the summary and the editable flow becomes one column. Section groups use a shared 11rem label rail on desktop and stack their label/description above the content on mobile.

The page rhythm is generous around group boundaries and compact inside rows. IDs and read-only values sit in small tonal fields; editable rows use dividers rather than nested card shells.

## Elevation & Depth

This is a tonal-layered system with one soft ambient shadow for primary surfaces. Borders establish structure; blur is reserved for existing app chrome and the summary's subtle accent atmosphere.

### Shadow Vocabulary
- **Soft surface:** `0 22px 56px -34px rgb(61 64 117 / 24%)` for the summary and contextual map.
- **Control:** `0 12px 26px -16px rgb(68 70 137 / 34%)` for small elevated controls in the app shell.

## Shapes

The system uses rounded rectangles with a medium 0.75rem control radius and a larger 1.75rem summary radius. Status badges are pills because they encode compact state. Inputs and selects share the same height, border, focus ring, and radius. Setting rows remain open and rectangular at rest so the page does not become a grid of repeated containers.

## Components

### Buttons
- **Shape:** rounded medium controls (0.75rem), compact 2rem default height.
- **Primary:** lavender background with dark ink text; use for save and commit actions.
- **Hover / Focus:** reduce primary opacity on hover; use a visible lavender ring on keyboard focus.
- **Ghost / Destructive:** quiet at rest, with rose text and a soft rose hover surface for removal.

### Chips
- **Style:** small pill with low-opacity primary background and primary text for configured/active states; muted surface for incomplete state.
- **State:** always paired with text or a check icon; color is not the only signal.

### Cards / Containers
- **Corner Style:** 1.75rem for the primary summary; 1.25rem for secondary context.
- **Background:** card white in light mode, theme card token in dark mode.
- **Shadow Strategy:** one ambient soft shadow; do not stack shadows across nested rows.
- **Border:** 1px cool border at reduced opacity.
- **Internal Padding:** 1.25–2rem depending on surface scale.

### Inputs / Fields
- **Style:** transparent or tonal field with a 1px input border, compact 2rem height, and medium radius.
- **Focus:** primary ring and border shift; preserve keyboard visibility.
- **Error / Disabled:** destructive ring for invalid fields; muted background and opacity for disabled controls.

### Navigation
- **Style:** floating sidebar with rounded active rows, compact system labels, and the same primary accent for the active route. Mobile collapses through the existing sidebar primitives.

### Workspace Settings Sections
- **Style:** uppercase label rail, one-sentence description, then open editable rows divided by 1px rules. The summary surface owns the visual emphasis; groups stay calm and scannable.

## Do's and Don'ts

### Do:
- **Do** lead settings screens with current state and progress before edit controls.
- **Do** group fields by the integration they support and keep inline actions beside their fields.
- **Do** keep IDs in monospace and preserve the existing i18n and light/dark tokens.
- **Do** use open dividers for repeated setting rows instead of nested cards.

### Don't:
- **Don't** create a mosaic of equal cards for routine configuration.
- **Don't** use accent color on every control or decorative region.
- **Don't** hide unavailable Discord choices without a clear recovery message.
- **Don't** use color as the only way to communicate configured or incomplete state.
