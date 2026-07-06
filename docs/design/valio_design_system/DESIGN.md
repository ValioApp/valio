---
name: VALIO Design System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d2daf0'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e0e8ff'
  surface-container-highest: '#dbe2f9'
  on-surface: '#141b2c'
  on-surface-variant: '#40484b'
  inverse-surface: '#293041'
  inverse-on-surface: '#edf0ff'
  outline: '#70787c'
  outline-variant: '#c0c8cb'
  surface-tint: '#306576'
  primary: '#003441'
  on-primary: '#ffffff'
  primary-container: '#0f4c5c'
  on-primary-container: '#87bbce'
  inverse-primary: '#9acee1'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffc641'
  on-secondary-container: '#715300'
  tertiary: '#2e302d'
  on-tertiary: '#ffffff'
  tertiary-container: '#454643'
  on-tertiary-container: '#b3b4af'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b6ebfe'
  primary-fixed-dim: '#9acee1'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#114d5d'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#f6be39'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#e3e3de'
  tertiary-fixed-dim: '#c6c7c2'
  on-tertiary-fixed: '#1a1c19'
  on-tertiary-fixed-variant: '#464744'
  background: '#f9f9ff'
  on-background: '#141b2c'
  surface-variant: '#dbe2f9'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar-width: 260px
  container-max: 1280px
---

## Brand & Style

The design system is engineered for a high-precision Spanish proptech SaaS, prioritizing clarity, data integrity, and a premium analytical feel. The brand personality is rooted in the "Precision-Trust" axis—combining the technical rigor of a developer tool like Linear with the financial authority of Stripe.

The visual style is **Modern Corporate / Minimalist**, emphasizing functional elegance. It utilizes expansive whitespace, a warm "paper" background to reduce eye strain during long analytical sessions, and a strict adherence to grid-based alignment. The aesthetic is professional yet sophisticated, designed to make complex real estate data feel accessible and authoritative.

Key brand attributes:
- **Trustworthy:** Professional Spanish (es-ES) copy and structured layouts.
- **Precise:** Use of monospaced and tabular numerals for financial data.
- **Data-Driven:** Clear hierarchies and specialized data visualization accents.

## Colors

The palette is anchored by a warm off-white surface that differentiates the product from standard "bleach-white" SaaS tools, providing a more tactile, premium feel. 

- **Primary (Deep Petrol):** Used for primary actions, navigation states, and core branding. It evokes stability and depth.
- **Secondary (Amber/Gold):** Reserved for "Money" moments—valuations, ROI indicators, and premium highlights.
- **Neutrals:** An "Ink" black is used for high-contrast typography, while "Hairline" gray (#E5E5E0) defines structural boundaries.
- **Semantic Palette:** Success (Emerald), Warning (Amber), and Error (Terracotta) are slightly desaturated to maintain the professional, analytical tone.
- **Data Visualization:** Maps should utilize a muted grayscale base (Silver/Mercury) with Petrol for selected assets and Gold for high-value targets.

## Typography

This design system uses a dual-font strategy. **Geist** provides a technical, precise edge for headlines and UI labels, while **Inter** ensures maximum legibility for body copy and data descriptions.

**Tabular Numerals:** For all currency (€) and property metrics (m²), `font-variant-numeric: tabular-nums` must be enabled. This ensures that columns of numbers align perfectly for easy visual scanning.

**Language & Localization:** All copy is in Spanish (es-ES). Ensure that character spacing accounts for longer Spanish word strings compared to English. 
- Currency formatting: `1.250.000 €` (Space before symbol).
- Legal Notice: Use `body-sm` in Amber (#D4A017) for mandatory legal disclosures at the base of valuation screens.

## Layout & Spacing

The design system employs a strict 4px baseline grid. 

**Desktop Layout:** A fixed-width left sidebar (260px) houses primary navigation. The main content area uses a 12-column fluid grid with 24px gutters. Use large internal paddings (32px+) to create a "Premium" sense of space.

**Mobile Layout:** Navigation transitions to a bottom bar for primary actions, with secondary settings/filters housed in a bottom-sheet drawer.

**Data Density:** While the overall brand is "airy," data tables should allow for "compact" modes where vertical padding is reduced to 8px to maximize information density for expert users.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Hairline Outlines** rather than heavy shadows.

- **Level 0 (Background):** #FAFAF7 (Warm off-white).
- **Level 1 (Cards/Containers):** Pure White (#FFFFFF) with a 1px border (#E5E5E0).
- **Shadows:** Use a single, highly diffused "Ambient" shadow for floating elements (modals, dropdowns): `0px 4px 20px rgba(16, 24, 40, 0.05)`. 
- **Interaction:** On hover, a card should not rise; instead, the border color should shift to the Primary Petrol color at 20% opacity.

## Shapes

The shape language is sophisticated and modern. All standard containers, inputs, and buttons utilize a **12px radius**. 

- **Standard (Rounded):** 12px (0.75rem). Applied to cards, input fields, and buttons.
- **Small (Soft):** 6px (0.375rem). Applied to checkboxes and small tags.
- **Large:** 24px (1.5rem). Applied to bottom sheets and large modal containers.

The consistency of the 12px radius across different component scales creates a unified, geometric rhythm that feels intentional and high-end.

## Components

### Buttons
- **Primary:** Background Petrol (#0F4C5C), Text White. 12px radius.
- **Secondary:** Border 1px (#E5E5E0), Text Ink (#101828), Background White.
- **Tertiary/Ghost:** No border, Petrol text, Subtle grey hover state.

### Input Fields
- White background with #E5E5E0 border. On focus: border shifts to Petrol (#0F4C5C) with a 2px soft outer glow in Petrol at 10% opacity. Labels use `label-caps`.

### Cards & Tables
- **Valuation Card:** Should feature a left-accent border in Amber (#D4A017) to denote financial importance. 
- **Data Tables:** Use a subtle zebra stripe (`#FAFAF7` on even rows). Header row uses `label-caps` typography with a bottom border.

### Chips & Badges
- **Status Chips:** Use desaturated background tints of the semantic colors (e.g., Success: 10% Emerald background with 100% Emerald text).
- **Currency Badges:** Use Amber (#D4A017) text with a thin amber border for high-value metrics.

### Navigation
- **Sidebar:** Petrol background or White with Petrol active states. Use Geist for nav items to maintain the technical "Linear-like" feel.