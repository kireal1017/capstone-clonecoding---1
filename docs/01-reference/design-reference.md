---
name: Serene Productivity
colors:
  surface: '#f9f9f7'
  surface-dim: '#dadad8'
  surface-bright: '#f9f9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#49473f'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#7a776e'
  outline-variant: '#cbc6bc'
  surface-tint: '#615e57'
  primary: '#21201a'
  on-primary: '#ffffff'
  primary-container: '#37352f'
  on-primary-container: '#a19d95'
  inverse-primary: '#cbc6bd'
  secondary: '#585f6c'
  on-secondary: '#ffffff'
  secondary-container: '#dce2f3'
  on-secondary-container: '#5e6572'
  tertiary: '#1d2023'
  on-tertiary: '#ffffff'
  tertiary-container: '#323538'
  on-tertiary-container: '#9b9ea1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e7e2d9'
  primary-fixed-dim: '#cbc6bd'
  on-primary-fixed: '#1d1c16'
  on-primary-fixed-variant: '#494740'
  secondary-fixed: '#dce2f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#e0e2e6'
  tertiary-fixed-dim: '#c4c7ca'
  on-tertiary-fixed: '#191c1f'
  on-tertiary-fixed-variant: '#44474a'
  background: '#f9f9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e1'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.015em
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 800px
  gutter: 16px
---

## Brand & Style

The design system is rooted in the philosophy of "quiet focus." It prioritizes content and utility over visual flourish, drawing inspiration from high-end analog stationery and minimalist digital workspaces. The brand personality is organized, dependable, and unobtrusive, designed to fade into the background so the user's work can take center stage.

The design style is **Minimalism** with a heavy emphasis on structural clarity. It utilizes high-quality typography, intentional whitespace, and a monochromatic foundation to evoke a sense of calm and order. The interface avoids unnecessary decoration, using subtle borders and a refined color palette to create a professional, "tool-like" atmosphere.

## Colors

The palette is intentionally restrained to reduce cognitive load. The primary background is a crisp white, while the neutral off-white (#F7F7F5) is used for sidebars, gutters, and secondary surfaces to provide soft structural separation. 

- **Primary Charcoal (#37352F):** Used for primary text, active states, and high-emphasis icons. It provides a softer contrast than pure black.
- **Slate Gray (#6B7280):** Used for secondary text, metadata, and inactive icons.
- **Soft Border (#E5E7EB):** A very light gray used for all structural borders and dividers.
- **Utility Background (#F7F7F5):** Reserved for grouped content areas and subtle container fills.

## Typography

The design system relies on **Inter** for its utilitarian precision and exceptional readability at small sizes. The typographic scale is optimized for information density without sacrificing clarity. 

Headline weights are kept slightly heavier to anchor the page, while body text uses a generous line height (1.5–1.6x) to ensure long-form task lists and notes remain legible. Labels and captions use a medium weight to differentiate them from body text without needing distinct colors.

## Layout & Spacing

This design system uses a **Fixed Grid** approach for content-heavy pages (like task views or documents) to prevent line lengths from becoming too wide. For dashboard views, it shifts to a **Fluid Grid** with 12 columns.

The spacing rhythm is built on a 4px baseline. Large margins (24px to 48px) are used to isolate primary content areas, creating a "breathable" interface that feels calm even when filled with data. Gutters are consistently 16px to maintain tight relationships between related task items.

## Elevation & Depth

To maintain a flat and focused aesthetic, depth is communicated through **Low-contrast outlines** and **Tonal layers** rather than heavy shadows.

- **Level 0 (Base):** Pure white (#FFFFFF) for the main editing or task area.
- **Level 1 (Surface):** Soft gray (#F7F7F5) for sidebars, navigation, or background panels.
- **Dividers:** 1px solid borders (#E5E7EB) are used to define regions. 
- **Active State:** A very subtle 2px blur shadow with 5% opacity may be used on "floating" elements like popover menus or dropdowns to provide just enough separation from the background.

## Shapes

The design system utilizes **Soft** geometry. Standard UI elements like buttons, input fields, and checkboxes use a 0.25rem (4px) corner radius. This provides a professional and precise look that is friendlier than sharp corners but more disciplined than fully rounded pill shapes. 

Larger containers like cards or modals may use a slightly more pronounced radius (8px) to soften the overall layout.

## Components

- **Buttons:** Primary buttons use the Charcoal fill with white text. Secondary buttons are ghost-style with a thin border (#E5E7EB) and Charcoal text. Use minimal padding: 8px vertical, 12px horizontal.
- **Task Items:** Horizontal list items with a 1px bottom border. Hover states should trigger a light gray fill (#F7F7F5).
- **Checkboxes:** Simple 16px squares with a 4px radius. When checked, use the Charcoal color with a thin white checkmark.
- **Input Fields:** Flat design with a 1px border (#E5E7EB). On focus, the border color shifts to a slightly darker gray or deep slate blue. No inner shadows.
- **Chips/Tags:** Small, rectangular labels with a light gray background (#F7F7F5) and medium-weight text (#6B7280). No borders.
- **Cards:** Used for grouping related settings or project overviews. Use a 1px solid border (#E5E7EB) with no shadow and a white background.
- **Icons:** Use thin-stroke (1.5pt to 2pt) functional icons. Icons should always be the same color as the text they accompany.