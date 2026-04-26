# Howl Studio — Design System v1.1

> A unified visual language for all Howl Studio products — events, web, mobile, LED & TV.  
> Built for consistency, speed, and brand trust.

**Version:** 1.1 · **Date:** April 2026 · **Status:** Internal use only

---

## Table of Contents

1. [Logo Usage](#1-logo-usage)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Spacing System](#4-spacing-system)
5. [Icons](#5-icons)
6. [UI Components](#6-ui-components)
7. [Notification System](#7-notification-system)
8. [Animation & Motion](#8-animation--motion)
9. [Cross-Platform Rules](#9-cross-platform-rules)
10. [CSS Design Tokens](#10-css-design-tokens)

---

## 1. Logo Usage

### Approved Backgrounds

| Background | Color | Status |
|---|---|---|
| Dark | `#0A0A0A` | ✅ Primary |
| Light | `#F5F5F5` | ✅ Approved |
| Gray | `#1C1C1C` | ✅ Approved |
| Accent (Electric Lime) | `#E8FF47` | ⚠️ Highlight only |

### Rules

- **DO NOT** stretch, rotate, or recolor the logo
- **DO NOT** add drop shadows or glows
- **DO NOT** place on busy/photo backgrounds without a solid backing layer
- **Minimum clear space** = 1× logo height on all four sides
- **Minimum size** = 80px wide (digital) / 20mm (print)

### Logo Anatomy

```
[●─●] Howl Studio
  │
  Icon: 6-node network graph, stroke 1.2px
  Wordmark: DM Sans Medium, 22px, letter-spacing -0.02em
  Gap between icon and wordmark: 14px
```

---

## 2. Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|---|---|---|---|
| Black | `#0A0A0A` | 10, 10, 10 | Primary background |
| White | `#F5F5F5` | 245, 245, 245 | Primary text / light BG |
| Electric Lime | `#E8FF47` | 232, 255, 71 | Brand accent / CTA |

### Gray Scale

| Name | Hex | Usage |
|---|---|---|
| Gray 900 | `#111111` | Surface / Card background |
| Gray 800 | `#1C1C1C` | Elevated surface |
| Gray 700 | `#2A2A2A` | Input background |
| Gray 600 | `#3D3D3D` | Borders |
| Gray 400 | `#7A7A7A` | Placeholder / Muted text |
| Gray 200 | `#C4C4C4` | Secondary text |
| Gray 100 | `#E8E8E8` | Hover state (light mode) |

### Semantic / Status Colors

| Name | Hex | Usage |
|---|---|---|
| Success | `#4ADE80` | Confirmation, active state |
| Warning | `#FBBF24` | Caution, pending state |
| Error | `#F87171` | Failure, critical alert |
| Info | `#60A5FA` | Informational message |

### Color Usage Rules

- **Electric Lime** is the only accent color. Do not introduce secondary brand colors.
- Always test contrast ratio: minimum **4.5:1** for body text, **7:1** for LED/TV.
- On LED screens, avoid pure `#FFFFFF` — use `#F5F5F5` to reduce flicker.
- Semantic colors are for **status only**, never for decoration.

---

## 3. Typography

### Typefaces

| Role | Font | Fallback |
|---|---|---|
| UI / Body / Headings | **DM Sans** | `sans-serif` |
| Labels / Code / Metadata | **DM Mono** | `monospace` |

> **Install:** Google Fonts — `DM Sans` (wght 300–600) + `DM Mono` (wght 400, 500)

### Type Scale

| Token | Size | Weight | Letter-spacing | Line-height | Usage |
|---|---|---|---|---|---|
| Display | 80px | 300 | -4% | 1.0 | Hero / splash screens |
| H1 | 56px | 600 | -3% | 1.1 | Page title |
| H2 | 40px | 500 | -2% | 1.2 | Section title |
| H3 | 28px | 500 | -2% | 1.3 | Sub-section |
| Body Large | 20px | 300 | 0 | 1.5 | Lead paragraph |
| Body | 16px | 400 | 0 | 1.6 | Default body text |
| Small | 13px | 400 | 0 | 1.5 | Captions, secondary info |
| Label / Mono | 11px | 400 | +12% | 1.4 | Section labels, metadata |

### Typography Rules

- **Negative letter-spacing** on all headings (creates the tight, modern feel).
- **DM Mono** is used exclusively for: section labels, hex codes, version numbers, system metadata, and inline code.
- **Never use** Arial, Roboto, or system UI fonts in Howl Studio products.
- On LED/TV, minimum rendered size is **24px** — do not use `Small` or `Label` on large displays.

---

## 4. Spacing System

All spacing is based on a **4px grid**. Use only these values.

| Token | Value | Common Usage |
|---|---|---|
| `--space-1` | 4px | Icon gap, tight padding |
| `--space-2` | 8px | Tag padding, icon-to-text |
| `--space-3` | 12px | Input padding (y-axis) |
| `--space-4` | 16px | Default padding, card gap |
| `--space-6` | 24px | Section element spacing |
| `--space-8` | 32px | Card padding |
| `--space-12` | 48px | Section internal padding |
| `--space-16` | 64px | Section bottom margin |
| `--space-24` | 96px | Section-to-section gap |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Tags, small elements |
| `--radius-md` | 8px | Inputs, buttons, cards |
| `--radius-lg` | 16px | Main cards, modals |
| `--radius-pill` | 999px | Tags/badges, toggle |

---

## 5. Icons

### Primary Library

**Phosphor Icons** — Regular weight

- **Size:** 20×20px (UI) / 24×24px (display / large screens)
- **Stroke weight:** 1.5px
- **Color:** Always `currentColor` (inherits from text)
- **Never mix** icon families within the same product

### Core Icon Set

| Icon | Usage |
|---|---|
| `clock` | Time, session duration |
| `home` | Navigation home |
| `search` | Search / find |
| `chart-bar` | Analytics, score |
| `user` | Profile, participant |
| `chat` | Messaging, comment |
| `wifi` | Connectivity status |
| `shield` | Security, verification |
| `check` | Success, confirmed |
| `x` | Close, dismiss, error |
| `info` | Info notification |
| `lightning` | Action, flash, quick |

### Icon Rules

- Icons must always have a text label or `aria-label` for accessibility.
- On touch screens, minimum tap target = **44×44px** (pad around the 20px icon).
- On LED/TV, render at **48px or larger**.

---

## 6. UI Components

### Buttons

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| Accent | `#E8FF47` | `#0A0A0A` | — | Primary CTA (1 per screen max) |
| Primary | `#F5F5F5` | `#0A0A0A` | — | Main action |
| Secondary | Transparent | `#F5F5F5` | `#2A2A2A` | Alternative action |
| Ghost | Transparent | `#7A7A7A` | — | Tertiary / navigation |

**Sizes:**

| Size | Padding | Font | Radius |
|---|---|---|---|
| Small | 6px 12px | 11px | 8px |
| Default | 10px 16px | 13px | 8px |
| Large | 14px 32px | 16px | 16px |

**Interaction states:**
- **Hover:** Accent glows `box-shadow: 0 0 24px rgba(232,255,71,0.35)`
- **Active/Press:** `transform: scale(0.97)` + ripple effect
- **Loading:** Spinner replaces label, button disabled
- **Disabled:** `opacity: 0.4`, `cursor: not-allowed`

---

### Tags & Badges

| Variant | Background | Text | Border |
|---|---|---|---|
| Default | `#1C1C1C` | `#C4C4C4` | — |
| Accent | `rgba(232,255,71,0.12)` | `#E8FF47` | `rgba(232,255,71,0.25)` |
| Success | `rgba(74,222,128,0.12)` | `#4ADE80` | `rgba(74,222,128,0.25)` |
| Warning | `rgba(251,191,36,0.12)` | `#FBBF24` | `rgba(251,191,36,0.25)` |
| Error | `rgba(248,113,113,0.12)` | `#F87171` | `rgba(248,113,113,0.25)` |

- Padding: `3px 10px` · Radius: `999px` · Font: 11px / 500

---

### Input Fields

```
Default:  background #1C1C1C · border #2A2A2A
Focus:    border #E8FF47 · box-shadow rgba(232,255,71,0.1) 0 0 0 3px
Disabled: opacity 0.4 · cursor not-allowed
Error:    border #F87171
```

- Font: DM Sans 13px
- Padding: `10px 16px`
- Radius: `8px`

---

## 7. Notification System

### Toast Types

| Type | Icon | Color | Use case |
|---|---|---|---|
| Info | ℹ | `#60A5FA` | System messages, updates |
| Success | ✓ | `#4ADE80` | Completed actions |
| Warning | △ | `#FBBF24` | Caution, connectivity issues |
| Error | ✕ | `#F87171` | Failures, disconnections |

### Behavior Rules

| Rule | Value |
|---|---|
| Auto-dismiss duration | 4 seconds |
| Position — Web | Top-right |
| Position — Mobile | Top-center |
| Position — Kiosk/LED | Bottom-center, larger font |
| Max stack | 3 toasts visible |
| Progress bar | Visible, matches toast color |
| Dismiss on hover | Pause progress bar |
| Manual dismiss | ✕ button, always visible |

---

## 8. Animation & Motion

### Duration Tokens

| Token | Value | Usage |
|---|---|---|
| `--duration-fast` | 120ms | Hover states, toggles, icon swaps |
| `--duration-base` | 240ms | Modals, dropdowns, transitions |
| `--duration-slow` | 400ms | Page loads, hero reveals |

### Easing Tokens

| Token | Value | Feel |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Fast start, smooth settle — use for entrances |
| `--ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Slow start, fast exit — use for exits |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Slight overshoot — use for interactive elements |

### Animation Patterns

| Pattern | Spec | Usage |
|---|---|---|
| Page load reveal | `fade + translateY(32px) → 0` · 700ms ease-out | Section entrances |
| Stagger delay | 80ms per child element | Card grids, list items |
| Hover lift | `translateY(-3px) + shadow` · 250ms | Cards |
| Button press | `scale(0.97)` · 120ms | All buttons |
| Ripple | Radial expand from click point · 500ms | Button click feedback |
| Pulse dot | Scale 1→1.5→1 · 1.4s infinite | Live status indicator |

### Event / LED Screen Rules

> ⚠️ These rules are mandatory for all large-format deployments.

- **No rapid flashing** above 3Hz (photosensitivity risk)
- **Prefer** fade/slide transitions over bounce/spring on large screens
- **Disable** parallax and complex scroll animations on TV/LED
- **Reduce** animation duration by 50% on kiosk (people scan faster)
- **Test** all animations at actual output resolution before event day

---

## 9. Cross-Platform Rules

| Platform | Base Font | Touch Target | Theme | Accent | Notes |
|---|---|---|---|---|---|
| Web (Desktop) | 16px | 32px min | Dark (default) | `#E8FF47` | Full token set |
| Mobile (iOS/Android) | 16px | 44px min | Dark (default) | `#E8FF47` | Increase all tap targets |
| LED Wall / TV | 24px+ | N/A | Dark (required) | `#E8FF47` | Min contrast 7:1, no small text |
| Tablet / Kiosk | 18px | 48px min | Dark (default) | `#E8FF47` | Landscape-first layout |
| Print / PDF | 10pt | N/A | Light (required) | `#0A0A0A` | CMYK color adapt |

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 640px | Single column, larger touch targets |
| Tablet | 640px – 1024px | 2-column grid |
| Desktop | > 1024px | Full layout, max-width 1080px |
| LED / Large | > 1920px | Scale factor 1.5× base font size |

---

## 10. CSS Design Tokens

Copy this block into your project's global stylesheet or design tokens file.

```css
/* ============================================
   HOWL STUDIO — Design Tokens v1.1
   April 2026 · howlstudio.io
============================================ */

:root {

  /* ── COLOR ── */
  --hs-black:       #0A0A0A;
  --hs-white:       #F5F5F5;
  --hs-accent:      #E8FF47;    /* Electric Lime — primary brand accent */
  --hs-accent-dim:  rgba(232, 255, 71, 0.12);

  --hs-gray-900:    #111111;
  --hs-gray-800:    #1C1C1C;
  --hs-gray-700:    #2A2A2A;
  --hs-gray-600:    #3D3D3D;
  --hs-gray-400:    #7A7A7A;
  --hs-gray-200:    #C4C4C4;
  --hs-gray-100:    #E8E8E8;

  /* ── SEMANTIC STATUS ── */
  --hs-success:     #4ADE80;
  --hs-warning:     #FBBF24;
  --hs-error:       #F87171;
  --hs-info:        #60A5FA;

  /* ── TYPOGRAPHY ── */
  --font-body:      'DM Sans', sans-serif;
  --font-mono:      'DM Mono', monospace;

  /* ── FONT SCALE ── */
  --text-xs:        11px;   /* Label / Mono */
  --text-sm:        13px;   /* Small / Button */
  --text-base:      16px;   /* Body */
  --text-md:        20px;   /* Body Large */
  --text-lg:        28px;   /* H3 */
  --text-xl:        40px;   /* H2 */
  --text-2xl:       56px;   /* H1 */
  --text-3xl:       80px;   /* Display */

  /* ── SPACING (4px grid) ── */
  --space-1:        4px;
  --space-2:        8px;
  --space-3:        12px;
  --space-4:        16px;
  --space-6:        24px;
  --space-8:        32px;
  --space-12:       48px;
  --space-16:       64px;
  --space-24:       96px;

  /* ── BORDER RADIUS ── */
  --radius-sm:      4px;
  --radius-md:      8px;
  --radius-lg:      16px;
  --radius-pill:    999px;

  /* ── MOTION ── */
  --ease-out:       cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:        cubic-bezier(0.7, 0, 0.84, 0);
  --ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast:  120ms;
  --duration-base:  240ms;
  --duration-slow:  400ms;
}
```

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| v1.1 | April 2026 | Added animation tokens, `--ease-spring`, LED rules, easing visualizer |
| v1.0 | April 2026 | Initial release — color, type, spacing, components, notifications |

---

*Howl Studio Design System — Internal Document*  
*Maintained by: Creative Director & Lead Developer*  
*Questions: raise an issue in the internal Notion workspace*
