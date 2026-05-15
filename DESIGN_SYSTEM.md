# Shake Shake Fresh Noodle — Design System

A complete style guide for the Benu / Shake Shake Fresh Noodle web app, so a
sibling site (e.g. the kitchen display) can be built with an identical look.
Everything in here is paste-ready — Tailwind config, custom CSS, the exact
class strings used by every component pattern.

---

## 1. Stack

| Layer       | Choice                                     |
| ----------- | ------------------------------------------ |
| Framework   | Next.js 15 (App Router) + React 19         |
| Styling     | Tailwind CSS 3.4 (no CSS-in-JS, no shadcn) |
| Language    | TypeScript                                 |
| Icons       | Inline SVG (Lucide-style strokes)          |
| Fonts       | System font stack (sans-serif + UI serif)  |
| State       | React `useState` + custom DOM events       |

No Tailwind plugins. No icon library. No animation library. Everything is
custom CSS keyframes + Tailwind utility classes.

---

## 2. Color palette

The whole site lives in warm, cream-y neutrals with two accent families
(orange "cantaloupe" + yellow "butter") and a single sage green. Black and
white are not used as a base — instead it's cream + neutral-900 ink.

### Brand tokens (in `tailwind.config.ts`)

```ts
colors: {
  cream:         "#FBF7EE",   // page background — the default canvas
  "cream-light": "#FFFBF2",   // cards / lighter surfaces
  "cream-dark":  "#F7EFDE",   // hover/sticky surfaces (rare)

  sage: {
    DEFAULT: "#D8E1D2",        // soft green accent
    dark:    "#A9BBA0",        // "ready" status pill
  },

  cantaloupe: {
    DEFAULT: "#FDA172",        // primary CTA accent (filter pill, active tab)
    soft:    "#FFB892",        // hover state
    deep:    "#E88A5C",        // active / pressed state
  },

  butter: {
    DEFAULT: "#FFD93D",        // "cooking" status pill
    soft:    "#FFE970",
    deep:    "#D4A91A",
  },
},
```

### Tailwind defaults you'll lean on

| Use case               | Class                          | Hex      |
| ---------------------- | ------------------------------ | -------- |
| Primary text / ink     | `text-neutral-900`             | `#171717` |
| Secondary text         | `text-neutral-700`             | `#404040` |
| Tertiary / muted text  | `text-neutral-500` / `-600`    | `#737373` / `#525252` |
| Placeholder text       | `text-neutral-400`             | `#a3a3a3` |
| Borders                | `border-neutral-200` / `-300`  | `#e5e5e5` / `#d4d4d4` |
| Card background        | `bg-white`                     | `#ffffff` |
| Warning text (allergen)| `text-amber-700` / `-800`      |          |
| Destructive            | `text-red-600`, `bg-red-50`    |          |

### When to use which accent

- **Cantaloupe** is the primary brand accent. It marks the active tab, the
  primary filter pill, the "+1" qty button, and orange chili glyphs.
- **Butter** is reserved for the "cooking" kitchen status pill.
- **Sage** is reserved for the "ready" kitchen status pill.
- **Cream** is the canvas — every screen has `bg-cream` on `<body>`.
- **Neutral-900** is the dominant "send / submit" CTA fill, with `text-cream`
  on top. Nothing is pure black or pure white.

---

## 3. Typography

### Font stack

The app uses the **system sans-serif** for everything except a handful of
display titles, which use a **system serif**.

```ts
fontFamily: {
  serif: [
    "ui-serif", "Georgia", "Cambria",
    "Times New Roman", "Times", "serif",
  ],
}
```

No web fonts are loaded. Default sans is whatever `font-sans` resolves to
(Tailwind's default system stack).

### Type roles

| Role                            | Classes                                              | Notes |
| ------------------------------- | ---------------------------------------------------- | ----- |
| Page title (cart, my orders)    | `font-serif text-2xl text-neutral-900 sm:text-3xl`   | Serif, sentence case |
| Section / card title            | `text-2xl font-semibold uppercase text-neutral-900 tracking-[0.08em]` | All-caps with letter-spacing |
| Dish name (menu card)           | `text-xl font-semibold uppercase tracking-[0.08em] min-h-[1.5em] text-neutral-900` | All-caps, fixed-height for grid alignment |
| Sub-label / section heading     | `text-base font-semibold uppercase tracking-wider text-neutral-700` | |
| Body text                       | `text-base leading-relaxed text-neutral-700`         | |
| Body description (muted)        | `text-base leading-relaxed text-neutral-500`         | |
| Small meta / caption            | `text-xs text-neutral-500`                           | |
| Tiny eyebrow                    | `text-[11px] font-semibold uppercase tracking-wider text-neutral-500` | |
| Numeric / tabular               | append `tabular-nums`                                | Used on every price and quantity |

### Tracking rules

- Latin / Cyrillic / Persian / Armenian uppercase titles → `tracking-[0.08em]`
  (about 1.3px at 20px). Letter-spacing helps caps read calmly.
- **CJK languages drop the tracking** (`tracking-normal`). Chinese, Japanese,
  Korean characters are already wide and full letter-spacing breaks the
  visual rhythm. Use a helper:

  ```ts
  className={isCJK(lang) ? "tracking-normal" : "tracking-[0.08em]"}
  ```

- Body text never uses extra tracking.

---

## 4. Page layout

### Body / canvas

```tsx
<html lang="en">
  <body>{children}</body>
</html>
```

```css
html, body {
  background-color: #FBF7EE;        /* cream */
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
  overscroll-behavior-y: none;
  -webkit-tap-highlight-color: transparent;
}
```

### Page chrome (every screen)

A consistent header pattern with three slots: logo (left), context label or
language toggle (right), and a sticky category nav below.

```tsx
<main className="min-h-screen w-full bg-cream pb-28">
  <div className="mx-auto w-full max-w-6xl">
    {/* Header row */}
    <div className="flex items-center justify-between gap-3 pl-3 pr-10 pt-4 sm:gap-3 sm:px-10 sm:pt-3">
      {/* Logo button (left) */}
      <button className="flex-none rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30">
        <div className="block overflow-hidden h-[60px] sm:h-[72px]">
          <img src="/shake-shake-logo.png" className="block h-[105px] sm:h-[134px] w-auto -mt-0.5 sm:-mt-1.5" />
        </div>
      </button>

      {/* Action group (right) */}
      <div className="flex items-center justify-end gap-2">
        {/* …switcher, filter, cart… */}
      </div>
    </div>

    {/* Sticky horizontal nav */}
    <nav className="sticky top-0 z-20 bg-cream">
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full items-center justify-start px-6 py-3 sm:justify-center sm:px-10 gap-2">
          {/* tab pills */}
        </div>
      </div>
    </nav>

    {/* Content grid */}
    <section className="grid grid-cols-1 gap-x-8 gap-y-6 px-6 pt-2 sm:grid-cols-2 sm:px-10 lg:grid-cols-3">
      {/* cards */}
    </section>
  </div>
</main>
```

- `bg-cream` on the root, **never** white.
- Max content width: `max-w-6xl` (72rem / 1152px). Center with `mx-auto`.
- Side padding: `px-6` mobile → `sm:px-10` desktop. The logo row uses
  asymmetric `pl-3 pr-10` on mobile to avoid clipping the logo PNG's
  transparent margin.
- Sticky nav uses the SAME `bg-cream` so it blends seamlessly when it pins.
- Logo PNG has ~43% transparent whitespace below the artwork — clip it with
  the `h-[60px] overflow-hidden` wrapper trick.

### Breakpoint

The site is **mobile-first** with a single major breakpoint at `sm` (640px).
Larger breakpoints (`md`, `lg`) are used only for grid column count.

| Breakpoint | Use case                              |
| ---------- | ------------------------------------- |
| `<sm`      | One column. Stack everything.         |
| `sm` (≥640px) | Two columns. Desktop chrome.       |
| `lg` (≥1024px) | Three columns on the menu grid.  |

---

## 5. Component patterns

### 5a. Buttons

| Variant            | Class string |
| ------------------ | ------------ |
| **Primary CTA** (big, dark, full width) | `rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-cream hover:bg-neutral-800 disabled:opacity-70` |
| **Cantaloupe pill** (active state) | `rounded-full bg-cantaloupe px-4 py-2 text-base font-medium text-neutral-900 hover:bg-cantaloupe-soft active:bg-cantaloupe-deep` |
| **Outline pill** (idle) | `rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100` |
| **Circular icon** (e.g. cart) | `h-10 w-10 inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-800 shadow-sm hover:bg-neutral-100` |
| **Quantity ±** (orange round) | `flex h-11 w-11 items-center justify-center rounded-full bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft active:bg-cantaloupe-deep` |
| **Text link** | `text-xs text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline` |

**Universal focus ring:** every button gets
`focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30`.

**Universal radius:** `rounded-full` for pill buttons, `rounded-2xl` for
cards, `rounded-3xl` for major popovers. Sharp corners (≤ `rounded-md`)
are reserved for the logo button.

### 5b. Cards

```tsx
{/* Menu card */}
<button className="group flex flex-col text-left rounded-[28px] outline-none transition-all duration-150 hover:-translate-y-0.5">
  <div className="relative overflow-hidden rounded-[28px] bg-white shadow-sm ring-4 ring-transparent transition-all duration-150 group-hover:bg-butter-soft group-hover:shadow-lg group-hover:ring-butter group-focus-visible:ring-butter">
    <div className="relative aspect-square w-full bg-gradient-to-br from-cream-light to-neutral-200/60">
      <img className="h-full w-full object-cover transition-[opacity,filter] duration-500 ease-out" />
    </div>
  </div>
  <div className="mt-3 px-1">
    <h3 className="...">{name}</h3>
    <p className="mt-1 text-base text-neutral-700">{price}</p>
    <p className="mt-2 text-base leading-relaxed text-neutral-500">{description}</p>
  </div>
</button>
```

Key moves:
- `rounded-[28px]` is the menu-card radius — bigger than `rounded-3xl`.
- Hover lifts the card 2px (`-translate-y-0.5`) AND tints the bg to
  `butter-soft` AND adds a `butter` ring AND deepens the shadow. The combo
  makes hover feel tactile without a heavy outline.
- Always wrap the image in a `relative aspect-square` div so layout doesn't
  jump while the photo loads. Use a gradient placeholder bg.
- Image fades in via `opacity-0` → `opacity-1` + `blur(8px)` → `blur(0)`
  on load. The `onLoad` handler bumps the styles in a `requestAnimationFrame`
  so the transition actually plays.

### 5c. Modals / drawers

The cart drawer, item-detail sheet, and filter sheet share one pattern: a
**bottom sheet on mobile, centered dialog on desktop**.

```tsx
<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
     onClick={onClose}>
  <div role="dialog"
       aria-modal="true"
       onClick={(e) => e.stopPropagation()}
       className="relative w-full max-w-[480px] h-[100dvh] overflow-y-auto overscroll-none bg-cream shadow-xl sm:h-auto sm:max-h-[88vh] sm:rounded-3xl">
    {/* ... */}
  </div>
</div>
```

- Backdrop: `bg-black/40 backdrop-blur-sm`. Always click-to-close on the
  backdrop, stop propagation on the panel.
- Width cap: `max-w-[480px]` for every drawer.
- Mobile: full-height bottom sheet with rounded corners.
- Desktop: centered dialog, `rounded-3xl`, `max-h-[88vh]`.
- On mobile, add a swipe-to-dismiss drag handle pill at the top:

  ```tsx
  <div className="sticky top-0 z-10 flex flex-col items-center justify-center bg-cream/95 pt-3 pb-1 backdrop-blur sm:hidden">
    <span className="h-1.5 w-12 rounded-full bg-neutral-300" />
  </div>
  ```

  Hide on desktop (`sm:hidden`); no swipe gesture there.
- Lock body scroll while a drawer is open. On iOS Safari `overflow:hidden`
  isn't enough — set `position:fixed; top:-${scrollY}px; width:100%` and
  restore on close.

### 5d. Confirm dialog (alertdialog)

A small centered card inside the drawer for "are you sure?" flows.

```tsx
<div role="alertdialog" aria-modal="true"
     className="mx-6 w-full max-w-[340px] rounded-2xl bg-cream p-5 shadow-xl">
  <h3 className="font-serif text-xl text-neutral-900">{title}</h3>
  <p className="mt-2 text-sm text-neutral-600">{body}</p>
  <div className="mt-5 flex gap-3">
    <button className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100">
      Cancel
    </button>
    <button className="flex-1 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-cream hover:bg-neutral-800">
      Confirm
    </button>
  </div>
</div>
```

### 5e. Form inputs

```tsx
<input className="rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-700/30" />

<textarea className="w-full resize-none rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-700/30" />
```

Invalid state swaps to red:
`border-red-400 focus:border-red-500 focus-visible:ring-red-500/30`
with a `role="alert"` message below.

### 5f. Status pills

Small inline badges:

```tsx
<span className="rounded-full bg-amber-50/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
  Filtered
</span>
```

Kitchen status uses the accent tokens:

| Status   | Background          | Text              |
| -------- | ------------------- | ----------------- |
| New      | `bg-cantaloupe`     | `text-neutral-900`|
| Cooking  | `bg-butter`         | `text-neutral-900`|
| Ready    | `bg-sage-dark`      | `text-neutral-900`|

### 5g. Tabs / category nav (horizontal scroll)

```tsx
<button className={isActive
  ? "flex-none whitespace-nowrap rounded-full bg-cantaloupe px-4 py-2 text-base font-medium text-neutral-900"
  : "flex-none whitespace-nowrap rounded-full px-4 py-2 text-base font-medium text-neutral-600 hover:text-neutral-900"
}>
  {label}
</button>
```

Container hides the scrollbar so the row reads as a clean pill row:

```tsx
<div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  <div className="flex w-max min-w-full items-center justify-start px-6 py-3 sm:justify-center sm:px-10 gap-2">
```

---

## 6. Spacing & radius scale

| Token         | Value         | Where it shows up |
| ------------- | ------------- | ----------------- |
| `gap-0.5`     | 2px           | tight clusters (mt between same-author messages) |
| `gap-1.5`     | 6px           | between dots / inline elements |
| `gap-2` / `gap-3` | 8 / 12px  | row-level spacing |
| `gap-x-8 gap-y-6` | 32 / 24px | menu grid |
| `px-6` / `sm:px-10` | 24 / 40px | side gutters |
| `py-3` / `py-4` | 12 / 16px   | section padding |
| `pb-28`       | 112px         | page-end padding (clears the floating cart button on mobile) |

Border radius:

| Class            | Use case |
| ---------------- | -------- |
| `rounded-full`   | pills, qty buttons, status badges |
| `rounded-md`     | logo button only |
| `rounded-xl`     | small thumbnails (cart-line image, suggestion tile) |
| `rounded-2xl`    | dialogs, cards, large inputs |
| `rounded-3xl`    | drawers, message bubbles |
| `rounded-[28px]` | menu cards specifically |

---

## 7. Shadows

Only three depths, used consistently:

| Class          | Use |
| -------------- | --- |
| `shadow-sm`    | resting card / button |
| `shadow-md`    | active dialog hero |
| `shadow-lg`    | hovered menu card |
| `shadow-xl`    | drawer / dialog container |

Never use `shadow-2xl`. Never colored shadows — the warm cream bg already
softens depth, so neutral box-shadows read naturally.

---

## 8. Animations

All custom keyframes live in `app/globals.css`. Every animation respects
`@media (prefers-reduced-motion: reduce)` and disables itself.

### Universal transitions

- Buttons / hover: `transition-colors` (default 150ms ease) or
  `transition-all duration-150` when transform is also changing.
- Image fade-in: `transition-[opacity,filter] duration-500 ease-out`.
- Drawer drag: `transition: transform 200ms ease-out`.

### Custom keyframes (paste into globals.css)

```css
/* Chili pepper wiggle on the spice indicator */
@keyframes benu-chili-wiggle {
  0%, 100% { transform: rotate(-4deg); }
  50%      { transform: rotate(6deg); }
}
.benu-chili {
  animation: benu-chili-wiggle 2.4s ease-in-out infinite;
  transform-origin: 50% 95%;
}

/* Chat typing indicator — three bouncing dots */
@keyframes benu-typing-dot {
  0%, 60%, 100% { transform: translateY(0);    opacity: 0.35; }
  30%           { transform: translateY(-4px); opacity: 1;    }
}
.benu-typing-dot { animation: benu-typing-dot 1.2s ease-in-out infinite; }
.benu-typing-dot:nth-child(2) { animation-delay: 0.15s; }
.benu-typing-dot:nth-child(3) { animation-delay: 0.30s; }

/* Soft shimmer that sweeps once across an orange-tinted pill */
@keyframes benu-input-shimmer {
  0%   { transform: translateX(0); }
  60%  { transform: translateX(350%); }
  100% { transform: translateX(350%); }
}

/* Soft orange accent text */
.benu-text-glow {
  color: #FDA172;
  text-shadow: 0 0 4px rgba(253, 161, 114, 0.18);
}

@media (prefers-reduced-motion: reduce) {
  .benu-chili,
  .benu-typing-dot { animation: none; }
}
```

---

## 9. Iconography

No icon library. Everything is **inline `<svg>`** with stroke-based geometry,
mirroring Lucide's visual style (1.8–2.5 stroke width, round caps and joins,
24×24 viewBox).

Default pattern:

```tsx
<svg xmlns="http://www.w3.org/2000/svg"
     width="18" height="18" viewBox="0 0 24 24"
     fill="none" stroke="currentColor"
     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
     aria-hidden="true">
  {/* path data */}
</svg>
```

Common sizes:
- 14px — dropdown chevrons
- 18px — inline button icons
- 22px — close / back buttons inside dialogs
- 28px — chat header close

When the SVG is purely decorative add `aria-hidden="true"`. When it IS the
button (no text label), set `aria-label` on the wrapping `<button>`.

---

## 10. Image handling

### Loading pattern

Every photo starts hidden + blurred and fades in on load:

```tsx
<img
  src={d.image}
  alt={d.name}
  loading="eager"           // for above-the-fold
  decoding="async"
  ref={(img) => {
    if (img && img.complete && img.naturalWidth > 0) {
      requestAnimationFrame(() => {
        img.style.opacity = "1";
        img.style.filter = "blur(0px)";
      });
    }
  }}
  style={{ filter: "blur(8px)" }}
  className="h-full w-full opacity-0 transition-[opacity,filter] duration-500 ease-out object-cover"
  onLoad={(e) => {
    requestAnimationFrame(() => {
      e.currentTarget.style.opacity = "1";
      e.currentTarget.style.filter = "blur(0px)";
    });
  }}
  onError={(e) => {
    // Fall back to a hand-drawn noodle-bowl SVG inlined as a data URL
  }}
/>
```

### Disable browser drag / select on every img

```css
img {
  -webkit-user-drag: none;
  user-select: none;
  -webkit-touch-callout: none;
  pointer-events: none;        /* keep image purely decorative */
}
```

Apply globally in `globals.css`. If you need a clickable image, wrap it in
a button.

### Product-on-white vs scene photos

Soda cans / packaged products are shot on white. They use `object-contain`
over `bg-white`. Plated dishes use `object-cover` over a warm gradient bg:

```tsx
className={`relative aspect-square w-full ${
  IS_PACKAGED ? "bg-white" : "bg-gradient-to-br from-cream-light to-neutral-200/60"
}`}
```

---

## 11. Accessibility patterns

- **Every interactive element has a visible focus ring**: `focus-visible:ring-2 focus-visible:ring-neutral-700/30`.
- **Modals use `role="dialog" aria-modal="true"`** and an `aria-label` (or
  `aria-labelledby`). Confirm dialogs use `role="alertdialog"`.
- **Icon-only buttons set `aria-label`** describing the action.
- **`aria-pressed`** for toggles (active tab, active language, filter chip).
- **`aria-live="polite"`** on the typing indicator and order-status updates
  so screen readers announce them.
- **`aria-hidden="true"`** on decorative SVGs and the drag handle pill.
- **Disable inputs** while a request is in flight (`disabled={isSending}`).
- **Tap highlight off**: globally `-webkit-tap-highlight-color: transparent`.

---

## 12. Layout: putting it together

The header / nav / content scaffold for a kitchen page would look like:

```tsx
<main className="min-h-screen w-full bg-cream pb-12">
  <div className="mx-auto w-full max-w-6xl">
    <header className="flex items-center justify-between gap-3 px-6 pt-4 sm:px-10 sm:pt-3">
      <img src="/shake-shake-logo.png" alt="Shake Shake Fresh Noodle" />
      <div className="flex items-center gap-2">
        {/* Status filter pills, sort, settings */}
      </div>
    </header>

    <nav className="sticky top-0 z-20 bg-cream">
      <div className="flex justify-center gap-2 px-6 py-3 sm:px-10">
        {/* Tabs: New / Cooking / Ready */}
      </div>
    </nav>

    <section className="grid grid-cols-1 gap-x-8 gap-y-6 px-6 pt-2 sm:grid-cols-2 sm:px-10 lg:grid-cols-3">
      {/* Order cards */}
    </section>
  </div>
</main>
```

---

## 13. Full Tailwind config (paste-ready)

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7EE",
        "cream-light": "#FFFBF2",
        "cream-dark": "#F7EFDE",
        sage: { DEFAULT: "#D8E1D2", dark: "#A9BBA0" },
        cantaloupe: { DEFAULT: "#FDA172", soft: "#FFB892", deep: "#E88A5C" },
        butter: { DEFAULT: "#FFD93D", soft: "#FFE970", deep: "#D4A91A" },
      },
      fontFamily: {
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
      },
      transitionDuration: { "150": "150ms" },
    },
  },
  plugins: [],
};
export default config;
```

---

## 14. Full base CSS (paste-ready)

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  background-color: #FBF7EE;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior-y: none;
  -webkit-tap-highlight-color: transparent;
}

*, *::before, *::after {
  -webkit-tap-highlight-color: transparent;
}

/* Slim scrollbar inside rounded popups */
.popup-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.2) transparent; }
.popup-scroll::-webkit-scrollbar { width: 4px; }
.popup-scroll::-webkit-scrollbar-track { background: transparent; margin: 24px 0; }
.popup-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 9999px; }
.popup-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.35); }

/* Disable drag / selection on every image */
img {
  -webkit-user-drag: none;
  user-select: none;
  -webkit-touch-callout: none;
  pointer-events: none;
}
```

---

## 15. Tone & language

- Sentence case for paragraphs.
- ALL CAPS for hero titles ("YOUR CART", "CHILI OIL POTATO SALAD").
- Friendly, lightly informal: "Add something tasty", "Pair a drink with
  your bowl", "Hi, I'm Benu."
- Never use exclamation marks except for celebratory moments (`Order placed!`).
- Empty / waiting states get a tiny illustration + one supportive line.

That's the whole system. If a screen feels off-brand, it's probably because:
1. It's white instead of `bg-cream`.
2. It's missing the cantaloupe accent.
3. A title uses `font-bold` instead of `font-semibold uppercase tracking-[0.08em]`.
4. A pill has a sharp corner instead of `rounded-full`.

Fixing any of those four usually pulls a screen back into the system.
